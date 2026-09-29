export type BuddyAnimation =
  | "idle"
  | "hang"
  | "walk"
  | "fallStart"
  | "fall"
  | "crawl"
  | "sit"
  | "lay";

export interface BuddyViewport {
  width: number;
  height: number;
}

export interface BuddyRng {
  next(): number;
}

export interface BuddyFrame {
  x: number;
  y: number;
  scaleX: 1 | -1;
  sprite: string;
  present: boolean;
}

const SPRITE_SIZE = 128;
const EDGE_BUFFER = 35;
const WALK_SPEED = 1.5;
const CRAWL_SPEED = 1;
const THROW_POWER = 0.5;
const AIR_RESISTANCE = 1;
const WEAK_DRAG_SPEED = 0.8;
const STRONG_DRAG_SPEED = 3.5;
const DRAG_IDLE_DELAY = 80;
const DRAG_VELOCITY_DECAY = 0.75;
const FLOOR_FRICTION = 0.9;
const MINIMUM_SLIDE_SPEED = 0.4;
const GRAVITY = 0.3;

const animations: Record<
  BuddyAnimation,
  { frames: string[]; frameSpeed: number }
> = {
  idle: { frames: ["idle_0"], frameSpeed: 500 },
  hang: {
    frames: ["hang_0", "hang_1", "hang_2", "hang_3", "hang_4"],
    frameSpeed: 500,
  },
  walk: { frames: ["walk_0", "walk_1", "walk_2"], frameSpeed: 150 },
  fallStart: { frames: ["fall_1"], frameSpeed: 500 },
  fall: { frames: ["fall_0"], frameSpeed: 500 },
  crawl: { frames: ["crawl_0", "crawl_1"], frameSpeed: 500 },
  sit: { frames: ["sit_0"], frameSpeed: 500 },
  lay: { frames: ["lay_0"], frameSpeed: 500 },
};

const behaviorDurations: Record<
  "idle" | "walk" | "crawl" | "sit" | "lay",
  { min: number; max: number }
> = {
  idle: { min: 2000, max: 5000 },
  walk: { min: 3000, max: 20000 },
  crawl: { min: 5000, max: 20000 },
  sit: { min: 6000, max: 20000 },
  lay: { min: 10000, max: 20000 },
};

const behaviorChoices: BuddyAnimation[] = [
  "walk",
  "walk",
  "walk",
  "sit",
  "sit",
  "sit",
  "sit",
  "sit",
  "sit",
  "crawl",
  "lay",
];

const leftFacingDragPin = { x: 70, y: 12 };
const rightFacingDragPin = { x: 58, y: 12 };

const defaultRng: BuddyRng = {
  next: () => Math.random(),
};

export class QuantaBuddyEngine {
  private viewport: BuddyViewport;
  private readonly rng: BuddyRng;
  private readonly reducedMotion: boolean;
  private readonly nowFn: () => number;

  private currentAnimation: BuddyAnimation = "idle";
  private currentFrame = 0;
  private visibleFrame = 0;
  private lastFrameTime = 0;
  private currentTime = 0;

  private x = 100;
  private y: number;
  private direction = 1;
  private presentState = false;

  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lastPointerTime = 0;
  private throwVelocityX = 0;
  private throwVelocityY = 0;
  private smoothedDragVelocityX = 0;
  private lastDragMotionTime = 0;

  private fallSpeed = 0;
  private fallStarting = false;
  private falling = false;
  private entering = false;
  private leaving = false;
  private walkingAround = false;
  private slidingAfterFall = false;
  private recoveringAfterFall = false;

  private fallStartDeadline: number | null = null;
  private behaviorDeadline: number | null = null;
  private walkAroundDeadline: number | null = null;
  private recoveryDeadline: number | null = null;
  private recoveryPhase: "stayLying" | "sitUp" | "sitThenStand" | null = null;

  constructor(opts: {
    viewport: BuddyViewport;
    rng?: BuddyRng;
    reducedMotion?: boolean;
    now?: () => number;
  }) {
    this.viewport = opts.viewport;
    this.rng = opts.rng ?? defaultRng;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.nowFn = opts.now ?? (() => performance.now());
    this.y = this.floorY;
  }

  get present(): boolean {
    return this.presentState;
  }

  setViewport(viewport: BuddyViewport): void {
    this.viewport = viewport;
    this.y = Math.min(this.y, this.floorY);
    this.x = this.clampHorizontal(this.x);
  }

  call(): void {
    this.presentState = true;
    this.stopSpecialActions();

    if (this.reducedMotion) {
      this.x = 100;
      this.y = this.floorY;
      this.direction = 1;
      this.setAnimation("idle");
      this.scheduleNextBehavior();
      return;
    }

    if (this.rng.next() < 0.5) {
      this.enterByFalling();
    } else {
      this.enterByWalking();
    }
  }

  leave(): void {
    if (!this.presentState) return;

    const visualLeft =
      this.normalScale === 1 ? this.x : this.x - SPRITE_SIZE;
    const screenCenter = this.viewport.width / 2;
    const buddyCenter = visualLeft + SPRITE_SIZE / 2;

    this.direction = buddyCenter < screenCenter ? -1 : 1;
    this.stopSpecialActions();
    this.leaving = true;
    this.y = this.floorY;
    this.setAnimation("walk");
  }

  sit(): void {
    if (!this.presentState) return;
    this.stopSpecialActions();
    this.y = this.floorY;
    this.setAnimation("sit");
    this.behaviorDeadline = this.currentTime + 10000;
  }

  walkAround(): void {
    if (!this.presentState) return;
    this.stopSpecialActions();
    this.walkingAround = true;
    this.y = this.floorY;
    this.setAnimation("walk");
    this.walkAroundDeadline =
      this.currentTime + this.randomBetween(8000, 30000);
  }

  remove(): void {
    this.presentState = false;
    this.stopSpecialActions();
  }

  pointerDown(clientX: number, clientY: number): void {
    if (!this.presentState) return;

    this.stopSpecialActions();
    this.dragging = true;
    this.setAnimation("hang");
    this.visibleFrame = 0;

    const eventTime = this.eventTime();
    this.lastPointerX = clientX;
    this.lastPointerY = clientY;
    this.lastPointerTime = eventTime;
    this.throwVelocityX = 0;
    this.throwVelocityY = 0;
    this.smoothedDragVelocityX = 0;
    this.lastDragMotionTime = eventTime;

    const pin = this.normalScale === -1 ? leftFacingDragPin : rightFacingDragPin;
    this.x = clientX - pin.x;
    this.y = clientY - pin.y;
  }

  pointerMove(clientX: number, clientY: number): void {
    if (!this.dragging) return;

    const now = this.eventTime();
    const elapsed = Math.max(now - this.lastPointerTime, 1);
    const mouseDeltaX = clientX - this.lastPointerX;
    const mouseDeltaY = clientY - this.lastPointerY;

    this.throwVelocityX = (mouseDeltaX / elapsed) * 16 * THROW_POWER;
    this.throwVelocityY = (mouseDeltaY / elapsed) * 16 * THROW_POWER;
    this.lastDragMotionTime = now;
    this.updateDraggedHangFrame(now);

    this.lastPointerX = clientX;
    this.lastPointerY = clientY;
    this.lastPointerTime = now;
    const pin = this.normalScale === -1 ? leftFacingDragPin : rightFacingDragPin;
    this.x = clientX - pin.x;
    this.y = clientY - pin.y;
  }

  pointerUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.fallStarting = true;
    this.falling = true;
    this.fallSpeed = this.throwVelocityY;
    this.setAnimation("fallStart");
    this.fallStartDeadline = this.currentTime + 100;
  }

  tick(time: number): BuddyFrame {
    this.currentTime = time;
    if (!this.presentState) return this.frame();

    this.processDeadlines();
    this.moveBuddy();
    this.showAnimationFrame(time);
    return this.frame();
  }

  private get floorY(): number {
    return Math.max(0, this.viewport.height - SPRITE_SIZE);
  }

  private get normalScale(): 1 | -1 {
    return this.direction === 1 ? -1 : 1;
  }

  private eventTime(): number {
    const now = this.nowFn();
    return Number.isFinite(now) ? now : this.currentTime;
  }

  private frame(): BuddyFrame {
    const animation = animations[this.currentAnimation];
    const sprite = animation.frames[this.visibleFrame] ?? animation.frames[0];
    return {
      x: this.x,
      y: this.y,
      scaleX: this.dragging ? 1 : this.normalScale,
      sprite,
      present: this.presentState,
    };
  }

  private setAnimation(animation: BuddyAnimation): void {
    this.currentAnimation = animation;
    this.currentFrame = 0;
    this.visibleFrame = 0;
    this.lastFrameTime = 0;
  }

  private stopSpecialActions(): void {
    this.dragging = false;
    this.falling = false;
    this.fallStarting = false;
    this.entering = false;
    this.leaving = false;
    this.walkingAround = false;
    this.slidingAfterFall = false;
    this.recoveringAfterFall = false;
    this.fallSpeed = 0;
    this.throwVelocityX = 0;
    this.throwVelocityY = 0;
    this.fallStartDeadline = null;
    this.behaviorDeadline = null;
    this.walkAroundDeadline = null;
    this.recoveryDeadline = null;
    this.recoveryPhase = null;
  }

  private enterByFalling(): void {
    this.x = this.randomBetween(0, Math.max(0, this.viewport.width - SPRITE_SIZE));
    this.y = -SPRITE_SIZE;
    this.direction = this.rng.next() < 0.5 ? -1 : 1;
    this.falling = true;
    this.setAnimation("fall");
  }

  private enterByWalking(): void {
    const fromLeft = this.rng.next() < 0.5;
    this.y = this.floorY;
    this.entering = true;
    this.setAnimation("walk");
    if (fromLeft) {
      this.x = -SPRITE_SIZE;
      this.direction = 1;
    } else {
      this.x = this.viewport.width + SPRITE_SIZE;
      this.direction = -1;
    }
  }

  private startLandingRecovery(): void {
    this.recoveringAfterFall = true;
    this.y = this.floorY;
    this.setAnimation("lay");
    this.recoveryPhase = this.chooseRandomItem([
      "stayLying",
      "sitUp",
      "sitThenStand",
    ]);
    this.recoveryDeadline =
      this.currentTime +
      (this.recoveryPhase === "stayLying"
        ? this.randomBetween(3000, 8000)
        : this.randomBetween(1000, 3000));
  }

  private processDeadlines(): void {
    if (
      this.fallStartDeadline !== null &&
      this.currentTime >= this.fallStartDeadline &&
      this.fallStarting
    ) {
      this.fallStartDeadline = null;
      this.fallStarting = false;
      if (this.falling) this.setAnimation("fall");
    }

    if (this.walkAroundDeadline !== null && this.currentTime >= this.walkAroundDeadline) {
      this.walkAroundDeadline = null;
      if (this.walkingAround) {
        this.walkingAround = false;
        this.setAnimation("idle");
        this.scheduleNextBehavior();
      }
    }

    if (
      this.recoveryDeadline !== null &&
      this.currentTime >= this.recoveryDeadline &&
      this.recoveringAfterFall
    ) {
      this.recoveryDeadline = null;
      if (this.recoveryPhase === "stayLying") {
        this.recoveringAfterFall = false;
        this.setAnimation("lay");
      } else if (this.recoveryPhase === "sitUp") {
        this.recoveringAfterFall = false;
        this.setAnimation("sit");
      } else if (this.recoveryPhase === "sitThenStand") {
        this.setAnimation("sit");
        this.recoveryDeadline =
          this.currentTime + this.randomBetween(1000, 3000);
        this.recoveryPhase = null;
      } else {
        this.recoveringAfterFall = false;
        this.setAnimation("idle");
      }
    }

    if (
      this.behaviorDeadline !== null &&
      this.currentTime >= this.behaviorDeadline &&
      !this.dragging &&
      !this.falling &&
      !this.entering &&
      !this.leaving &&
      !this.slidingAfterFall &&
      !this.recoveringAfterFall
    ) {
      this.behaviorDeadline = null;
      this.chooseNextBehavior();
    }
  }

  private chooseNextBehavior(): void {
    if (!this.presentState || this.reducedMotion) {
      this.scheduleNextBehavior();
      return;
    }

    if (this.currentAnimation === "idle") {
      const nextBehavior = this.chooseRandomItem(behaviorChoices);
      if (this.rng.next() < 0.3) this.direction *= -1;
      this.setAnimation(nextBehavior);
    } else {
      this.setAnimation("idle");
    }
    this.scheduleNextBehavior();
  }

  private scheduleNextBehavior(): void {
    if (!this.presentState) return;
    const duration = behaviorDurations[this.currentAnimation as keyof typeof behaviorDurations];
    this.behaviorDeadline = this.currentTime + (duration
      ? this.randomBetween(duration.min, duration.max)
      : 1000);
  }

  private moveBuddy(): void {
    if (this.entering) {
      this.x += this.direction * WALK_SPEED;
      if (
        (this.direction === 1 && this.x >= 100) ||
        (this.direction === -1 &&
          this.x <= this.viewport.width - SPRITE_SIZE - 100)
      ) {
        this.entering = false;
        this.setAnimation("idle");
        this.scheduleNextBehavior();
      }
    } else if (!this.dragging && !this.falling && !this.leaving) {
      if (this.currentAnimation === "walk" || this.walkingAround) {
        this.x += this.direction * WALK_SPEED;
      }
      if (this.currentAnimation === "crawl" && this.visibleFrame === 1) {
        this.x += this.direction * CRAWL_SPEED;
      }
      this.x = this.clampHorizontal(this.x);
    }

    if (this.falling) {
      this.throwVelocityX *= AIR_RESISTANCE;
      this.x += this.throwVelocityX;
      if (Math.abs(this.throwVelocityX) > 0.5) {
        this.direction = this.throwVelocityX > 0 ? 1 : -1;
      }

      this.fallSpeed += GRAVITY;
      this.y += this.fallSpeed;
      this.reflectAtHorizontalEdge(0.5);

      if (this.y >= this.floorY) {
        this.y = this.floorY;
        this.falling = false;
        this.fallStarting = false;
        this.fallStartDeadline = null;
        this.fallSpeed = 0;
        this.throwVelocityY = 0;
        if (Math.abs(this.throwVelocityX) > MINIMUM_SLIDE_SPEED) {
          this.slidingAfterFall = true;
          this.setAnimation("lay");
        } else {
          this.throwVelocityX = 0;
          this.startLandingRecovery();
        }
      }
    }

    if (this.slidingAfterFall) {
      this.x += this.throwVelocityX;
      this.throwVelocityX *= FLOOR_FRICTION;
      this.y = this.floorY;
      this.reflectAtHorizontalEdge(0.4);
      if (Math.abs(this.throwVelocityX) <= MINIMUM_SLIDE_SPEED) {
        this.slidingAfterFall = false;
        this.throwVelocityX = 0;
        this.startLandingRecovery();
      }
    }

    if (this.leaving) {
      this.x += this.direction * WALK_SPEED;
      if (this.x < -SPRITE_SIZE || this.x > this.viewport.width + SPRITE_SIZE) {
        this.remove();
      }
    }
  }

  private showAnimationFrame(time: number): void {
    const animation = animations[this.currentAnimation];
    if (this.dragging && this.currentAnimation === "hang") {
      this.updateDraggedHangFrame(time);
      return;
    }
    if (time - this.lastFrameTime >= animation.frameSpeed) {
      this.visibleFrame = this.currentFrame;
      this.currentFrame = (this.currentFrame + 1) % animation.frames.length;
      this.lastFrameTime = time;
    }
  }

  private updateDraggedHangFrame(time: number): void {
    const idleTime = time - this.lastDragMotionTime;
    if (idleTime > DRAG_IDLE_DELAY) {
      this.throwVelocityX *= DRAG_VELOCITY_DECAY;
      this.throwVelocityY *= DRAG_VELOCITY_DECAY;
      this.smoothedDragVelocityX *= DRAG_VELOCITY_DECAY;
    } else {
      this.smoothedDragVelocityX =
        this.smoothedDragVelocityX * 0.75 + this.throwVelocityX * 0.25;
    }

    const dragSpeed = Math.abs(this.smoothedDragVelocityX);
    if (dragSpeed < WEAK_DRAG_SPEED) {
      this.visibleFrame = 0;
    } else if (this.smoothedDragVelocityX > 0) {
      this.visibleFrame = dragSpeed >= STRONG_DRAG_SPEED ? 2 : 1;
    } else if (this.smoothedDragVelocityX < 0) {
      this.visibleFrame = dragSpeed >= STRONG_DRAG_SPEED ? 4 : 3;
    }
  }

  private clampHorizontal(value: number): number {
    return Math.min(
      this.viewport.width - SPRITE_SIZE + EDGE_BUFFER,
      Math.max(-EDGE_BUFFER, value)
    );
  }

  private reflectAtHorizontalEdge(reflection: number): void {
    const max = this.viewport.width - SPRITE_SIZE + EDGE_BUFFER;
    if (this.x < -EDGE_BUFFER) {
      this.x = -EDGE_BUFFER;
      this.throwVelocityX = Math.abs(this.throwVelocityX) * reflection;
      this.direction = 1;
    } else if (this.x > max) {
      this.x = max;
      this.throwVelocityX = -Math.abs(this.throwVelocityX) * reflection;
      this.direction = -1;
    }
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(this.rng.next() * (max - min + 1)) + min;
  }

  private chooseRandomItem<T>(items: T[]): T {
    return items[Math.floor(this.rng.next() * items.length)] ?? items[0];
  }
}
