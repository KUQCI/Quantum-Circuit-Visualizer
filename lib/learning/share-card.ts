/**
 * Render a downloadable Quantum Academy level-up card.
 *
 * The renderer is intentionally canvas-only so it can be used without React
 * or any browser layout dependencies.
 */
export function renderLevelCard(
  opts: {
    level: number;
    title: string;
    totalXp: number;
    quantaImage: HTMLImageElement | null;
  },
  canvas: HTMLCanvasElement
): void {
  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0b1220");
  gradient.addColorStop(1, "#172033");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(125, 211, 252, 0.07)";
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.fillStyle = "#7dd3fc";
  context.font = "600 20px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("QCI · QUANTUM COMPUTING INITIATIVE", 72, 82);
  context.letterSpacing = "0px";

  context.fillStyle = "#f8fafc";
  context.font = "700 56px Arial, sans-serif";
  context.fillText(`Level ${Math.max(1, Math.round(opts.level))} · ${opts.title}`, 72, 190);

  context.fillStyle = "#cbd5e1";
  context.font = "400 28px Arial, sans-serif";
  context.fillText(
    `${Math.max(0, Math.round(opts.totalXp))} XP earned in Quantum Academy`,
    76,
    248
  );

  context.fillStyle = "rgba(125, 211, 252, 0.16)";
  context.fillRect(72, 294, 560, 2);

  if (opts.quantaImage && opts.quantaImage.naturalWidth > 0) {
    const frameX = 828;
    const frameY = 116;
    const frameSize = 320;
    context.fillStyle = "rgba(125, 211, 252, 0.08)";
    roundedRect(context, frameX, frameY, frameSize, frameSize, 28);
    context.fill();

    const padding = 22;
    const maxSize = frameSize - padding * 2;
    const scale = Math.min(
      maxSize / opts.quantaImage.naturalWidth,
      maxSize / opts.quantaImage.naturalHeight
    );
    const imageWidth = opts.quantaImage.naturalWidth * scale;
    const imageHeight = opts.quantaImage.naturalHeight * scale;
    context.drawImage(
      opts.quantaImage,
      frameX + (frameSize - imageWidth) / 2,
      frameY + (frameSize - imageHeight) / 2,
      imageWidth,
      imageHeight
    );
  }

  context.fillStyle = "#94a3b8";
  context.font = "400 20px Arial, sans-serif";
  context.fillText("qcinit.tech/Quantum-Circuit-Visualizer", 72, 570);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
