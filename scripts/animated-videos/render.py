#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Sequence

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from manim import (
    AnimationGroup,
    Arc,
    ArcBetweenPoints,
    Arrow,
    Circle,
    Circumscribe,
    Create,
    DashedLine,
    Dot,
    DOWN,
    Ellipse,
    FadeIn,
    FadeOut,
    Group,
    GrowArrow,
    ImageMobject,
    Indicate,
    LaggedStart,
    LEFT,
    Line,
    MoveAlongPath,
    ORIGIN,
    PI,
    Rectangle,
    RIGHT,
    Rotate,
    RoundedRectangle,
    Scene,
    Succession,
    SurroundingRectangle,
    Text,
    Transform,
    Triangle,
    UP,
    UpdateFromAlphaFunc,
    ValueTracker,
    VGroup,
    Write,
    linear,
    smooth,
)
from manim.utils.bezier import interpolate


AUDIO_SAMPLE_RATE = 24000
BEAT_PAUSE_SECONDS = 0.45
FADE_SECONDS = 0.015
VIDEO_WIDTH = 1280
VIDEO_HEIGHT = 720
VIDEO_FPS = 30
HEADER_Y = 3.5
HEADER_RULE_Y = 3.02
FOOTER_Y = -3.34
CONTENT_Y = 0.08
QUANTA_HOME = np.array([-6.28, FOOTER_Y, 0.0])
CHILD_STORYBOARDS = "QCV_ANIMATED_STORYBOARDS"
CHILD_LESSON = "QCV_ANIMATED_LESSON"
CHILD_TIMINGS = "QCV_ANIMATED_TIMINGS"
CHILD_REPO_ROOT = "QCV_ANIMATED_REPO_ROOT"


@dataclass(frozen=True)
class Step:
    seconds: float
    animations: tuple[Any, ...]
    rate_func: Callable[[float], float] = smooth


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render the Quantum Basics animated-video pilot."
    )
    parser.add_argument("--storyboards", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--voices", required=True, type=Path)
    parser.add_argument("--lessons", help="Comma-separated lesson ids")
    parser.add_argument("--voice-name", default="af_heart")
    return parser.parse_args()


def ensure_non_empty(path: Path) -> None:
    if not path.is_file() or path.stat().st_size == 0:
        raise FileNotFoundError(f"Missing or empty file: {path}")


def load_storyboards(path: Path) -> dict[str, Any]:
    ensure_non_empty(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("style", {}).get("resolution") != [VIDEO_WIDTH, VIDEO_HEIGHT]:
        raise ValueError("Storyboard resolution must be 1280x720")
    if data.get("style", {}).get("fps") != VIDEO_FPS:
        raise ValueError("Storyboard frame rate must be 30 fps")
    lessons = data.get("lessons")
    if not isinstance(lessons, list) or not lessons:
        raise ValueError("Storyboard must contain lessons")
    return data


def vtt_time(seconds: float) -> str:
    total_ms = round(seconds * 1000)
    hours, remaining = divmod(total_ms, 3_600_000)
    minutes, remaining = divmod(remaining, 60_000)
    secs, milliseconds = divmod(remaining, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{milliseconds:03}"


def allocate_beat_frames(durations: Sequence[float]) -> list[int]:
    raw = np.asarray(durations, dtype=float) * VIDEO_FPS
    frames = np.floor(raw).astype(int)
    target = round(float(raw.sum()))
    remaining = target - int(frames.sum())
    order = np.argsort(-(raw - frames))
    for index in order[:remaining]:
        frames[index] += 1
    return frames.tolist()


def synthesize_lesson(
    kokoro: Kokoro,
    lesson: dict[str, Any],
    voice_name: str,
    out_dir: Path,
) -> tuple[Path, Path, list[dict[str, float | int]]]:
    chunks: list[np.ndarray] = []
    timings: list[dict[str, float | int]] = []
    cues = ["WEBVTT", ""]
    audio_time = 0.0

    for index, beat in enumerate(lesson["beats"], 1):
        speech = beat["speech"]
        samples, sample_rate = kokoro.create(
            speech,
            voice=voice_name,
            speed=1.0,
            lang="en-us",
        )
        if sample_rate != AUDIO_SAMPLE_RATE:
            raise RuntimeError(
                f"Kokoro returned {sample_rate} Hz; expected {AUDIO_SAMPLE_RATE} Hz"
            )
        clip = np.asarray(samples, dtype=np.float32)
        if clip.ndim != 1 or clip.size == 0:
            raise RuntimeError(
                f"Kokoro returned invalid audio for {lesson['id']} beat {index}"
            )
        clip = clip.copy()
        fade_samples = min(int(sample_rate * FADE_SECONDS), clip.size // 2)
        if fade_samples:
            clip[:fade_samples] *= np.linspace(
                0.0, 1.0, fade_samples, dtype=np.float32
            )
            clip[-fade_samples:] *= np.linspace(
                1.0, 0.0, fade_samples, dtype=np.float32
            )

        speech_duration = clip.size / sample_rate
        pause = np.zeros(
            int(sample_rate * BEAT_PAUSE_SECONDS),
            dtype=np.float32,
        )
        beat_audio = np.concatenate((clip, pause))
        beat_duration = beat_audio.size / sample_rate
        chunks.append(beat_audio)
        timings.append(
            {
                "speechDuration": speech_duration,
                "audioDuration": beat_duration,
            }
        )
        cues.extend(
            [
                str(index),
                f"{vtt_time(audio_time)} --> "
                f"{vtt_time(audio_time + speech_duration)}",
                beat["caption"],
                "",
            ]
        )
        audio_time += beat_duration
        print(
            f"{lesson['id']}: beat {index}/{len(lesson['beats'])} "
            f"({speech_duration:.2f}s speech)",
            flush=True,
        )

    frame_counts = allocate_beat_frames(
        [float(timing["audioDuration"]) for timing in timings]
    )
    for timing, frame_count in zip(timings, frame_counts, strict=True):
        timing["frameCount"] = frame_count
        timing["videoDuration"] = frame_count / VIDEO_FPS

    narration_path = out_dir / f"{lesson['id']}-narration.wav"
    sf.write(
        narration_path,
        np.concatenate(chunks),
        AUDIO_SAMPLE_RATE,
        format="WAV",
        subtype="PCM_16",
    )
    ensure_non_empty(narration_path)

    vtt_path = out_dir / f"{lesson['id']}.vtt"
    vtt_path.write_text("\n".join(cues) + "\n", encoding="utf-8")
    ensure_non_empty(vtt_path)
    return narration_path, vtt_path, timings


def run_command(command: Sequence[str], env: dict[str, str] | None = None) -> None:
    print("+ " + " ".join(command), flush=True)
    subprocess.run(command, check=True, env=env)


def render_silent_video(
    storyboards_path: Path,
    lesson_id: str,
    timings: list[dict[str, float | int]],
    repo_root: Path,
    work_dir: Path,
) -> Path:
    timing_path = work_dir / f"{lesson_id}-timings.json"
    timing_path.write_text(
        json.dumps(timings, indent=2) + "\n",
        encoding="utf-8",
    )
    media_dir = work_dir / "media"
    env = os.environ.copy()
    env.update(
        {
            CHILD_STORYBOARDS: str(storyboards_path),
            CHILD_LESSON: lesson_id,
            CHILD_TIMINGS: str(timing_path),
            CHILD_REPO_ROOT: str(repo_root),
        }
    )
    run_command(
        [
            sys.executable,
            "-m",
            "manim",
            "--renderer",
            "cairo",
            "--disable_caching",
            "--format",
            "mp4",
            "--fps",
            str(VIDEO_FPS),
            "-r",
            f"{VIDEO_WIDTH},{VIDEO_HEIGHT}",
            "--media_dir",
            str(media_dir),
            "--output_file",
            f"{lesson_id}-silent",
            "--progress_bar",
            "none",
            "--verbosity",
            "WARNING",
            str(Path(__file__).resolve()),
            "AnimatedLessonScene",
        ],
        env=env,
    )
    matches = list(media_dir.rglob(f"{lesson_id}-silent.mp4"))
    if len(matches) != 1:
        raise RuntimeError(
            f"Expected one silent render for {lesson_id}, found {matches}"
        )
    ensure_non_empty(matches[0])
    return matches[0]


def mux_lesson(
    silent_video: Path,
    narration_path: Path,
    output_path: Path,
) -> None:
    run_command(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(silent_video),
            "-i",
            str(narration_path),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-ar",
            "48000",
            "-ac",
            "1",
            "-shortest",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
    )
    ensure_non_empty(output_path)


class AnimatedLessonScene(Scene):
    def construct(self) -> None:
        storyboards_path = Path(os.environ[CHILD_STORYBOARDS])
        lesson_id = os.environ[CHILD_LESSON]
        timings_path = Path(os.environ[CHILD_TIMINGS])
        repo_root = Path(os.environ[CHILD_REPO_ROOT])
        data = load_storyboards(storyboards_path)
        self.style = data["style"]
        self.lesson = next(
            lesson for lesson in data["lessons"] if lesson["id"] == lesson_id
        )
        self.timings = json.loads(timings_path.read_text(encoding="utf-8"))
        self.repo_root = repo_root
        self.font = self.style["font"]
        self.colors = {
            key: self.style[key]
            for key in (
                "background",
                "foreground",
                "muted",
                "brand",
                "success",
                "warning",
                "danger",
            )
        }
        self.camera.background_color = self.colors["background"]
        self.caption: VGroup | None = None
        self.current_visual: Any | None = None
        self.state: dict[str, Any] = {}
        self._build_chrome()

        for beat, timing in zip(
            self.lesson["beats"],
            self.timings,
            strict=True,
        ):
            method_name = (
                f"_beat_{lesson_id.replace('-', '_')}_"
                f"{beat['id'].replace('-', '_')}"
            )
            method = getattr(self, method_name)
            method(beat, int(timing["frameCount"]))

    def _text(
        self,
        value: str,
        size: float,
        color: str | None = None,
        weight: str = "NORMAL",
        font: str | None = None,
    ) -> Text:
        return Text(
            value,
            font=font or self.font,
            font_size=size,
            color=color or self.colors["foreground"],
            weight=weight,
        )

    def _build_chrome(self) -> None:
        logo_path = self.repo_root / self.style["logoImage"]
        quanta_path = self.repo_root / self.style["quantaImage"]
        ensure_non_empty(logo_path)
        ensure_non_empty(quanta_path)

        logo = ImageMobject(str(logo_path)).set_height(0.54)
        logo.move_to([-6.66, HEADER_Y, 0])
        header_value = (
            f"Quanta Academy · {self.lesson['module']} · {self.lesson['title']}"
        )
        header_text = self._text(header_value, 23, weight="BOLD")
        if header_text.width > 11.9:
            header_text.scale_to_fit_width(11.9)
        header_text.next_to(logo, RIGHT, buff=0.2)
        header_text.set_y(HEADER_Y)
        header_rule = Line(
            [-7.0, HEADER_RULE_Y, 0],
            [7.0, HEADER_RULE_Y, 0],
            color=self.colors["muted"],
            stroke_width=1.2,
        ).set_opacity(0.36)

        footer = RoundedRectangle(
            width=13.72,
            height=1.22,
            corner_radius=0.18,
            stroke_color=self.colors["muted"],
            stroke_width=1.0,
            fill_color="#0b1220",
            fill_opacity=0.94,
        ).move_to([0, FOOTER_Y, 0])

        self.quanta = ImageMobject(str(quanta_path)).set_height(1.05)
        self.quanta.move_to(QUANTA_HOME)
        self.add(footer, header_rule)
        self.add(Group(logo, header_text))

    def _wrap_text(
        self,
        value: str,
        max_width: float,
        sizes: Sequence[float],
        max_lines: int,
        color: str | None = None,
        weight: str = "NORMAL",
        font: str | None = None,
    ) -> VGroup:
        words = value.split()
        for size in sizes:
            lines: list[str] = []
            current = ""
            for word in words:
                candidate = word if not current else f"{current} {word}"
                probe = self._text(
                    candidate,
                    size,
                    color=color,
                    weight=weight,
                    font=font,
                )
                if current and probe.width > max_width:
                    lines.append(current)
                    current = word
                else:
                    current = candidate
            if current:
                lines.append(current)
            if len(lines) <= max_lines:
                result = VGroup(
                    *[
                        self._text(
                            line,
                            size,
                            color=color,
                            weight=weight,
                            font=font,
                        )
                        for line in lines
                    ]
                )
                result.arrange(DOWN, aligned_edge=LEFT, buff=0.07)
                return result
        raise ValueError(f"Text does not fit in {max_lines} lines: {value}")

    def _caption_mobject(self, caption: str) -> VGroup:
        group = self._wrap_text(
            caption,
            max_width=12.3,
            sizes=(36, 34, 32, 30, 28),
            max_lines=2,
        )
        group.move_to([0.64, FOOTER_Y, 0])
        group.align_to(np.array([-5.42, FOOTER_Y, 0]), LEFT)
        return group

    def _content_caption(self, caption: str, max_width: float = 9.8) -> VGroup:
        return self._wrap_text(
            caption,
            max_width=max_width,
            sizes=(28, 26, 24),
            max_lines=3,
            color=self.colors["muted"],
        )

    def _transition(
        self,
        caption: str,
        clear_current: bool = True,
    ) -> Step:
        next_caption = self._caption_mobject(caption)
        animations: list[Any] = [FadeIn(next_caption)]
        if self.caption is not None:
            animations.append(FadeOut(self.caption))
        self.caption = next_caption
        if clear_current and self.current_visual is not None:
            animations.append(FadeOut(self.current_visual))
            self.current_visual = None
        return Step(0.36, tuple(animations), linear)

    @staticmethod
    def _allocate_step_frames(steps: Sequence[Step], budget: int) -> list[int]:
        if not steps:
            return []
        weights = np.asarray([step.seconds for step in steps], dtype=float)
        requested = max(len(steps), round(float(weights.sum()) * VIDEO_FPS))
        target = min(budget, requested)
        target = max(len(steps), target)
        raw = weights / weights.sum() * target
        frames = np.floor(raw).astype(int)
        frames[frames < 1] = 1
        while int(frames.sum()) > target:
            candidates = np.where(frames > 1)[0]
            if not candidates.size:
                break
            index = candidates[np.argmax(frames[candidates] - raw[candidates])]
            frames[index] -= 1
        while int(frames.sum()) < target:
            index = int(np.argmax(raw - frames))
            frames[index] += 1
        return frames.tolist()

    def _run_beat(
        self,
        frame_count: int,
        steps: Sequence[Step],
        bob_quanta: bool = True,
    ) -> None:
        usable_steps = [step for step in steps if step.animations]
        hold_frames = min(6, max(1, frame_count // 12))
        animation_budget = max(len(usable_steps), frame_count - hold_frames)
        step_frames = self._allocate_step_frames(
            usable_steps,
            animation_budget,
        )

        updater = None
        if bob_quanta:
            phase = [0.0]

            def updater(mobject: Any, dt: float) -> None:
                phase[0] += dt
                mobject.move_to(
                    QUANTA_HOME
                    + UP * (0.045 * math.sin(phase[0] * 2 * PI / 1.8))
                )

            self.quanta.add_updater(updater)

        consumed = 0
        for step, frames in zip(usable_steps, step_frames, strict=True):
            self.play(
                *step.animations,
                run_time=frames / VIDEO_FPS,
                rate_func=step.rate_func,
            )
            consumed += frames
        remaining = frame_count - consumed
        if remaining > 0:
            self.wait(remaining / VIDEO_FPS)

        if updater is not None:
            self.quanta.remove_updater(updater)
            self.quanta.move_to(QUANTA_HOME)

    def _fit_content(
        self,
        mobject: Any,
        max_width: float = 11.7,
        max_height: float = 4.8,
    ) -> Any:
        if mobject.width > max_width:
            mobject.scale_to_fit_width(max_width)
        if mobject.height > max_height:
            mobject.scale_to_fit_height(max_height)
        mobject.move_to([0, CONTENT_Y, 0])
        return mobject

    def _gate_tile(
        self,
        label: str,
        center: Sequence[float],
        width: float = 0.92,
        height: float = 0.74,
        color: str | None = None,
    ) -> VGroup:
        tile_color = color or self.colors["brand"]
        box = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.12,
            stroke_color=tile_color,
            stroke_width=2.2,
            fill_color=tile_color,
            fill_opacity=0.14,
        )
        label_text = self._text(label, 28, color=tile_color, weight="BOLD")
        group = VGroup(box, label_text)
        group.move_to(center)
        return group

    def _bit_card(
        self,
        value: str,
        center: Sequence[float] = ORIGIN,
        width: float = 3.0,
        height: float = 2.6,
    ) -> tuple[VGroup, VGroup, Text]:
        box = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.22,
            stroke_color=self.colors["brand"],
            stroke_width=2.5,
            fill_color="#0f1b2e",
            fill_opacity=0.96,
        )
        label = self._text("bit", 24, color=self.colors["muted"])
        label.move_to(box.get_top() + DOWN * 0.38)
        digit = self._text(value, 88, weight="BOLD")
        digit.move_to(box.get_center() + DOWN * 0.16)
        shell = VGroup(box, label)
        card = VGroup(shell, digit)
        card.move_to(center)
        return card, shell, digit

    def _flip_animation(
        self,
        shell: VGroup,
        digit: Text,
        new_value: str,
    ) -> Succession:
        center = digit.get_center()
        shell_flat = shell.copy().stretch(0.08, dim=0)
        digit_flat = digit.copy().stretch(0.08, dim=0)
        new_flat = self._text(new_value, 88, weight="BOLD")
        new_flat.move_to(center).stretch(0.08, dim=0)
        shell_full = shell.copy()
        new_full = self._text(new_value, 88, weight="BOLD").move_to(center)
        return Succession(
            AnimationGroup(
                Transform(shell, shell_flat),
                Transform(digit, digit_flat),
            ),
            Transform(digit, new_flat),
            AnimationGroup(
                Transform(shell, shell_full),
                Transform(digit, new_full),
            ),
        )

    def _wire(self, center: Sequence[float] = ORIGIN) -> dict[str, Any]:
        line = Line(
            [-2.7, 0, 0],
            [3.15, 0, 0],
            color=self.colors["foreground"],
            stroke_width=3,
        )
        q_label = self._text("q[0]", 24, color=self.colors["muted"])
        q_label.next_to(line, LEFT, buff=1.05)
        state = self._text("|0⟩", 28, color=self.colors["brand"])
        state.next_to(line, LEFT, buff=0.18)
        group = VGroup(q_label, state, line)
        group.move_to(center)
        return {"group": group, "line": line, "q": q_label, "state": state}

    def _two_bar_chart(
        self,
        values: tuple[float, float],
        value_labels: tuple[str, str],
        title: str,
        color: str,
        notes: tuple[str, str] | None = None,
        compact: bool = False,
    ) -> VGroup:
        width = 4.8 if not compact else 3.6
        height = 3.65 if not compact else 2.6
        frame = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.18,
            stroke_color=self.colors["muted"],
            stroke_width=1.2,
            fill_color="#0c1626",
            fill_opacity=0.9,
        )
        title_text = self._text(
            title,
            24 if not compact else 20,
            color=self.colors["muted"],
            weight="BOLD",
        )
        title_text.move_to(frame.get_top() + DOWN * 0.34)
        baseline_y = frame.get_bottom()[1] + (0.82 if not compact else 0.58)
        baseline = Line(
            [frame.get_left()[0] + 0.5, baseline_y, 0],
            [frame.get_right()[0] - 0.5, baseline_y, 0],
            color=self.colors["muted"],
            stroke_width=1.2,
        )
        x_positions = (-0.95, 0.95)
        max_bar_height = 1.78 if not compact else 1.22
        bar_width = 0.78 if not compact else 0.58
        parts: list[Any] = [frame, title_text, baseline]
        for index, (x, value, value_label, basis) in enumerate(
            zip(x_positions, values, value_labels, ("|0⟩", "|1⟩"), strict=True)
        ):
            bar_height = max(0.045, value * max_bar_height)
            bar = Rectangle(
                width=bar_width,
                height=bar_height,
                stroke_color=color,
                stroke_width=1.4,
                fill_color=color,
                fill_opacity=0.72,
            ).move_to([x, baseline_y + bar_height / 2, 0])
            value_text = self._text(
                value_label,
                22 if not compact else 18,
                color=color,
                weight="BOLD",
            )
            value_text.next_to(bar, UP, buff=0.1)
            basis_text = self._text(
                basis,
                22 if not compact else 18,
                color=self.colors["foreground"],
            )
            basis_text.next_to(baseline, DOWN, buff=0.12)
            basis_text.set_x(x)
            parts.extend([bar, value_text, basis_text])
            if notes:
                note = self._text(
                    notes[index],
                    18 if not compact else 15,
                    color=self.colors["muted"],
                )
                note.move_to([x, frame.get_bottom()[1] + 0.24, 0])
                parts.append(note)
        return VGroup(*parts)

    def _meter(self, center: Sequence[float]) -> VGroup:
        body = RoundedRectangle(
            width=2.2,
            height=1.62,
            corner_radius=0.2,
            stroke_color=self.colors["warning"],
            stroke_width=2.4,
            fill_color="#191b24",
            fill_opacity=0.94,
        )
        arc = Arc(
            radius=0.58,
            start_angle=0,
            angle=PI,
            color=self.colors["foreground"],
            stroke_width=2,
        )
        arc.move_to(body.get_center() + DOWN * 0.05)
        needle = Line(
            body.get_center() + DOWN * 0.08,
            body.get_center() + UP * 0.36 + RIGHT * 0.24,
            color=self.colors["danger"],
            stroke_width=3,
        )
        label = self._text("M", 22, color=self.colors["warning"], weight="BOLD")
        label.move_to(body.get_bottom() + UP * 0.24)
        group = VGroup(body, arc, needle, label)
        group.move_to(center)
        return group

    def _bloch_sphere(
        self,
        center: Sequence[float],
        equator_labels: bool = False,
    ) -> dict[str, Any]:
        center_point = np.asarray(center, dtype=float)
        outline = Circle(
            radius=1.48,
            color=self.colors["brand"],
            stroke_width=2.4,
        ).move_to(center_point)
        equator = Ellipse(
            width=2.96,
            height=0.72,
            color=self.colors["muted"],
            stroke_width=1.7,
        ).move_to(center_point)
        axis = DashedLine(
            center_point + UP * 1.72,
            center_point + DOWN * 1.72,
            color=self.colors["muted"],
            stroke_width=1.4,
        )
        north = self._text("|0⟩", 24, color=self.colors["foreground"])
        north.move_to(center_point + UP * 1.85)
        south = self._text("|1⟩", 24, color=self.colors["foreground"])
        south.move_to(center_point + DOWN * 1.83)
        parts: list[Any] = [outline, equator, axis, north, south]
        if equator_labels:
            plus = self._text("|+⟩", 22, color=self.colors["success"])
            plus.move_to(center_point + RIGHT * 1.82)
            minus = self._text("|−⟩", 22, color=self.colors["danger"])
            minus.move_to(center_point + LEFT * 1.82)
            parts.extend([plus, minus])
        arrow = Arrow(
            center_point,
            center_point + UP * 1.24,
            buff=0,
            color=self.colors["warning"],
            stroke_width=5,
            max_tip_length_to_length_ratio=0.18,
        )
        return {
            "sphere": VGroup(*parts),
            "arrow": arrow,
            "center": center_point,
        }

    def _phase_dial(
        self,
        center: Sequence[float],
        basis: str,
    ) -> dict[str, Any]:
        circle = Circle(
            radius=0.7,
            color=self.colors["brand"],
            stroke_width=2,
        ).move_to(center)
        pointer = Line(
            circle.get_center(),
            circle.get_center() + RIGHT * 0.55,
            color=self.colors["warning"],
            stroke_width=3,
        )
        dot = Dot(circle.get_center(), radius=0.045, color=self.colors["warning"])
        basis_text = self._text(basis, 22)
        basis_text.next_to(circle, UP, buff=0.14)
        degree = self._text("0°", 20, color=self.colors["muted"])
        degree.next_to(circle, DOWN, buff=0.12)
        group = VGroup(circle, pointer, dot, basis_text, degree)
        return {
            "group": group,
            "circle": circle,
            "pointer": pointer,
            "degree": degree,
        }

    def _shot_histogram(
        self,
        counts: tuple[int, int],
        guide: bool = False,
    ) -> dict[str, Any]:
        frame = RoundedRectangle(
            width=7.0,
            height=3.55,
            corner_radius=0.2,
            stroke_color=self.colors["muted"],
            stroke_width=1.3,
            fill_color="#0c1626",
            fill_opacity=0.92,
        ).move_to([0, CONTENT_Y, 0])
        baseline_y = frame.get_bottom()[1] + 0.65
        bin_centers = (-1.72, 1.72)
        parts: list[Any] = [frame]
        for center_x, label, count in zip(
            bin_centers,
            ("0", "1"),
            counts,
            strict=True,
        ):
            bin_box = RoundedRectangle(
                width=2.65,
                height=2.15,
                corner_radius=0.12,
                stroke_color=self.colors["brand"],
                stroke_width=1.5,
                fill_color="#111c2d",
                fill_opacity=0.68,
            ).move_to([center_x, baseline_y + 1.06, 0])
            label_text = self._text(label, 26, weight="BOLD")
            label_text.move_to([center_x, frame.get_bottom()[1] + 0.3, 0])
            count_text = self._text(
                str(count),
                22,
                color=self.colors["brand"],
                weight="BOLD",
            )
            count_text.move_to([center_x, frame.get_top()[1] - 0.33, 0])
            parts.extend([bin_box, label_text, count_text])
        if guide:
            guide_line = DashedLine(
                [-3.15, baseline_y + 1.18, 0],
                [3.15, baseline_y + 1.18, 0],
                color=self.colors["warning"],
                stroke_width=1.5,
            )
            guide_label = self._text(
                "50%",
                18,
                color=self.colors["warning"],
            )
            guide_label.next_to(guide_line, RIGHT, buff=0.12)
            parts.extend([guide_line, guide_label])

        labels = VGroup(*parts)
        total = sum(counts)
        order: list[int] = []
        shared = min(counts)
        for index in range(shared):
            order.extend((0, 1))
        order.extend([0] * (counts[0] - shared))
        order.extend([1] * (counts[1] - shared))

        slots: list[list[np.ndarray]] = [[], []]
        for bin_index, count in enumerate(counts):
            columns = 6 if count <= 21 else 8
            spacing_x = 0.22
            spacing_y = 0.22
            rows = math.ceil(count / columns)
            for index in range(count):
                row = index // columns
                column = index % columns
                x = (
                    bin_centers[bin_index]
                    + (column - (columns - 1) / 2) * spacing_x
                )
                y = baseline_y + 0.3 + row * spacing_y
                slots[bin_index].append(np.array([x, y, 0.0]))

        used = [0, 0]
        starts: list[np.ndarray] = []
        destinations: list[np.ndarray] = []
        dots = VGroup()
        for index, bin_index in enumerate(order):
            destination = slots[bin_index][used[bin_index]]
            used[bin_index] += 1
            start = np.array(
                [
                    destination[0] + 0.18 * math.sin(index * 1.7),
                    frame.get_top()[1] - 0.2,
                    0.0,
                ]
            )
            dot = Dot(
                start,
                radius=0.07,
                color=(
                    self.colors["success"]
                    if bin_index == 0
                    else self.colors["brand"]
                ),
            )
            dot.set_opacity(0)
            dots.add(dot)
            starts.append(start)
            destinations.append(destination)

        counter_label = self._text(
            "Shots:",
            21,
            color=self.colors["muted"],
        )
        counter_label.move_to([0.0, frame.get_top()[1] - 0.33, 0])
        counter_value = self._text("0", 22, color=self.colors["foreground"])
        counter_center = np.array([0.0, frame.get_top()[1] - 0.33, 0.0])
        counter_value.move_to(counter_center)

        def update_counter(number: Text) -> None:
            number.become(
                self._text(
                    str(round(tracker.get_value())),
                    22,
                    color=self.colors["foreground"],
                )
            )
            number.move_to(counter_center)

        counter_value.next_to(counter_label, RIGHT, buff=0.12)
        tracker = ValueTracker(0)
        counter_center = counter_value.get_center()
        counter_value.add_updater(update_counter)
        counter = VGroup(counter_label, counter_value)

        def drop(mobject: VGroup, alpha: float) -> None:
            for index, dot in enumerate(mobject):
                if total == 1:
                    start_fraction = 0.0
                else:
                    start_fraction = 0.76 * (
                        index / (total - 1)
                    ) ** 0.64
                local = np.clip(
                    (alpha - start_fraction) / 0.22,
                    0.0,
                    1.0,
                )
                dot.set_opacity(float(min(1.0, local * 4)))
                dot.move_to(
                    interpolate(
                        starts[index],
                        destinations[index],
                        smooth(float(local)),
                    )
                )

        return {
            "frame": labels,
            "dots": dots,
            "counter": counter,
            "tracker": tracker,
            "animation": UpdateFromAlphaFunc(dots, drop),
            "total": total,
        }

    def _title_intro(
        self,
        beat: dict[str, str],
        frame_count: int,
    ) -> None:
        transition = self._transition(beat["caption"])
        module = self._text(
            self.lesson["module"].upper(),
            26,
            color=self.colors["brand"],
            weight="BOLD",
        )
        title = self._text(self.lesson["title"], 58, weight="BOLD")
        if title.width > 10.8:
            title.scale_to_fit_width(10.8)
        title_group = VGroup(module, title).arrange(DOWN, buff=0.2)
        title_group.move_to([0, 0.72, 0])
        self.quanta.set_height(1.7).move_to([0, -1.05, 0])
        steps = [
            transition,
            Step(
                0.8,
                (
                    FadeIn(title_group),
                    FadeIn(self.quanta, scale=0.05),
                ),
            ),
            Step(
                0.32,
                (self.quanta.animate.shift(UP * 0.28).scale(1.08),),
                smooth,
            ),
            Step(
                0.32,
                (self.quanta.animate.shift(DOWN * 0.28).scale(1 / 1.08),),
                smooth,
            ),
            Step(
                0.75,
                (
                    FadeOut(title_group),
                    self.quanta.animate.set_height(1.05).move_to(QUANTA_HOME),
                ),
            ),
        ]
        self._run_beat(frame_count, steps, bob_quanta=False)
        self.current_visual = None

    def _outro_title(
        self,
        beat: dict[str, str],
        frame_count: int,
        clear_current: bool = True,
    ) -> tuple[Step, VGroup]:
        transition = self._transition(
            beat["caption"],
            clear_current=clear_current,
        )
        title = self._text(
            "Your turn",
            54,
            color=self.colors["brand"],
            weight="BOLD",
        )
        content_caption = self._content_caption(beat["caption"])
        group = VGroup(title, content_caption).arrange(DOWN, buff=0.24)
        group.move_to([1.15, 0.25, 0])
        return transition, group

    def _beat_what_is_a_qubit_intro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        self._title_intro(beat, frame_count)

    def _beat_what_is_a_qubit_classical_bit(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        card, shell, digit = self._bit_card("0", [0, 0.12, 0])
        steps = [
            transition,
            Step(0.72, (FadeIn(card, scale=0.9),)),
            Step(0.8, (self._flip_animation(shell, digit, "1"),), linear),
            Step(0.8, (self._flip_animation(shell, digit, "0"),), linear),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = card

    def _beat_what_is_a_qubit_qubit_wire(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        wire = self._wire([0, 0.12, 0])
        glow = Dot(
            wire["line"].get_start(),
            radius=0.13,
            color=self.colors["brand"],
        ).set_opacity(0.7)
        glow_path = Line(
            wire["line"].get_start(),
            wire["line"].get_end(),
        )
        group = VGroup(wire["group"], glow)
        steps = [
            transition,
            Step(
                0.85,
                (
                    FadeIn(wire["q"]),
                    FadeIn(wire["state"]),
                    Create(wire["line"]),
                ),
            ),
            Step(
                1.1,
                (
                    Succession(
                        FadeIn(glow, scale=0.2),
                        MoveAlongPath(glow, glow_path),
                        FadeOut(glow),
                    ),
                ),
                linear,
            ),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = group

    def _beat_what_is_a_qubit_amplitudes(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        chart = self._two_bar_chart(
            (1.0, 0.0),
            ("1.0", "0.0"),
            "Amplitudes",
            self.colors["brand"],
        )
        middle = self._two_bar_chart(
            (0.6, 0.8),
            ("0.6", "0.8"),
            "Amplitudes",
            self.colors["brand"],
        )
        probability = self._two_bar_chart(
            (0.36, 0.64),
            ("36%", "64%"),
            "Probabilities",
            self.colors["success"],
            ("(0.6)² = 0.36", "(0.8)² = 0.64"),
        )
        for item in (chart, middle, probability):
            item.move_to([0, 0.1, 0])
        steps = [
            transition,
            Step(0.7, (FadeIn(chart),)),
            Step(1.1, (Transform(chart, middle),)),
            Step(1.15, (Transform(chart, probability),)),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = chart

    def _beat_what_is_a_qubit_measurement(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        chart = self.current_visual
        transition = self._transition(beat["caption"], clear_current=False)
        meter = self._meter([-4.45, 0.1, 0])
        result = RoundedRectangle(
            width=2.65,
            height=2.35,
            corner_radius=0.22,
            stroke_color=self.colors["success"],
            stroke_width=2.5,
            fill_color="#10271d",
            fill_opacity=0.96,
        )
        result_digit = self._text(
            "1",
            92,
            color=self.colors["success"],
            weight="BOLD",
        )
        result_card = VGroup(result, result_digit).move_to([0, 0.08, 0])
        histogram = self._shot_histogram((18, 32))
        histogram_group = VGroup(
            histogram["frame"],
            histogram["dots"],
            histogram["counter"],
        )
        steps = [
            transition,
            Step(0.55, (FadeIn(meter, scale=0.9),)),
        ]
        if chart is not None:
            steps.append(Step(0.75, (Transform(chart, result_card), FadeOut(meter))))
            result_object = chart
        else:
            steps.append(Step(0.75, (FadeIn(result_card), FadeOut(meter))))
            result_object = result_card
        steps.extend(
            [
                Step(0.45, (FadeOut(result_object),)),
                Step(
                    0.62,
                    (
                        FadeIn(histogram["frame"]),
                        FadeIn(histogram["counter"]),
                    ),
                ),
                Step(
                    2.6,
                    (
                        histogram["animation"],
                        histogram["tracker"].animate.set_value(
                            histogram["total"]
                        ),
                    ),
                    linear,
                ),
            ]
        )
        self._run_beat(frame_count, steps)
        histogram["counter"][1].clear_updaters()
        self.remove(histogram["tracker"])
        self.current_visual = histogram_group

    def _beat_what_is_a_qubit_bloch(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        bloch = self._bloch_sphere([0, 0.18, 0])
        group = VGroup(bloch["sphere"], bloch["arrow"])
        steps = [
            transition,
            Step(
                0.8,
                (
                    FadeIn(bloch["sphere"]),
                    GrowArrow(bloch["arrow"]),
                ),
            ),
            Step(
                2.2,
                (
                    Rotate(
                        bloch["arrow"],
                        angle=-2 * PI,
                        about_point=bloch["center"],
                    ),
                ),
                linear,
            ),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = group

    def _beat_what_is_a_qubit_outro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition, group = self._outro_title(beat, frame_count)
        steps = [
            transition,
            Step(
                0.78,
                (
                    self.quanta.animate.set_height(1.72).move_to(
                        [-2.75, 0.0, 0]
                    ),
                    FadeIn(group),
                ),
            ),
            Step(0.3, (self.quanta.animate.shift(UP * 0.3),)),
            Step(0.3, (self.quanta.animate.shift(DOWN * 0.3),)),
        ]
        self._run_beat(frame_count, steps, bob_quanta=False)
        self.current_visual = group

    def _beat_bits_vs_qubits_intro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        self._title_intro(beat, frame_count)

    def _beat_bits_vs_qubits_side_by_side(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        divider = Line(
            [0, -1.95, 0],
            [0, 2.1, 0],
            color=self.colors["muted"],
            stroke_width=1.4,
        ).set_opacity(0.6)
        bit_title = self._text("Bit", 28, color=self.colors["brand"], weight="BOLD")
        bit_title.move_to([-3.25, 1.78, 0])
        qubit_title = self._text(
            "Qubit",
            28,
            color=self.colors["brand"],
            weight="BOLD",
        )
        qubit_title.move_to([3.25, 1.78, 0])
        bit_card, shell, digit = self._bit_card(
            "0",
            [-3.25, -0.15, 0],
            width=2.6,
            height=2.2,
        )
        initial_chart = self._two_bar_chart(
            (1.0, 0.0),
            ("1", "0"),
            "Amplitudes",
            self.colors["brand"],
            compact=True,
        ).move_to([3.2, -0.05, 0])
        target_chart = self._two_bar_chart(
            (0.71, 0.71),
            ("0.71", "0.71"),
            "Amplitudes",
            self.colors["brand"],
            compact=True,
        ).move_to([3.2, -0.05, 0])
        group = VGroup(
            divider,
            bit_title,
            qubit_title,
            bit_card,
            initial_chart,
        )
        steps = [
            transition,
            Step(
                0.75,
                (
                    Create(divider),
                    FadeIn(bit_title),
                    FadeIn(qubit_title),
                    FadeIn(bit_card),
                    FadeIn(initial_chart),
                ),
            ),
            Step(
                1.0,
                (
                    self._flip_animation(shell, digit, "1"),
                    Transform(initial_chart, target_chart),
                ),
                linear,
            ),
            Step(0.8, (self._flip_animation(shell, digit, "0"),), linear),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = group

    def _beat_bits_vs_qubits_not_a_coin(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        coin = Circle(
            radius=0.58,
            stroke_color=self.colors["warning"],
            stroke_width=3,
            fill_color=self.colors["warning"],
            fill_opacity=0.16,
        )
        coin_label = self._text(
            "H",
            38,
            color=self.colors["warning"],
            weight="BOLD",
        )
        coin_group = VGroup(coin, coin_label).move_to([0, 1.45, 0])
        cup = Arc(
            radius=1.25,
            start_angle=0,
            angle=PI,
            color=self.colors["brand"],
            stroke_width=8,
        )
        cup_base = Line(
            [-1.25, 0, 0],
            [1.25, 0, 0],
            color=self.colors["brand"],
            stroke_width=8,
        )
        cup_group = VGroup(cup, cup_base).move_to([0, -0.18, 0])
        cross_a = Line(
            [-2.15, -1.75, 0],
            [2.15, 1.75, 0],
            color=self.colors["danger"],
            stroke_width=10,
        )
        cross_b = Line(
            [-2.15, 1.75, 0],
            [2.15, -1.75, 0],
            color=self.colors["danger"],
            stroke_width=10,
        )
        cross = VGroup(cross_a, cross_b)
        group = VGroup(coin_group, cup_group, cross)
        steps = [
            transition,
            Step(0.45, (FadeIn(coin_group),)),
            Step(0.72, (coin_group.animate.move_to([0, -0.45, 0]),)),
            Step(0.55, (FadeIn(cup_group, shift=UP * 0.2),)),
            Step(0.72, (cup_group.animate.shift(RIGHT * 0.78),)),
            Step(0.58, (cup_group.animate.shift(LEFT * 0.78),)),
            Step(0.75, (Create(cross_a), Create(cross_b)), linear),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = group

    def _beat_bits_vs_qubits_interference(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        top_label = self._text(
            "In step",
            24,
            color=self.colors["success"],
            weight="BOLD",
        ).move_to([-4.8, 1.25, 0])
        bottom_label = self._text(
            "Opposite",
            24,
            color=self.colors["danger"],
            weight="BOLD",
        ).move_to([-4.8, -1.05, 0])
        top_a = Arrow(
            [-2.9, 1.25, 0],
            [-1.55, 1.25, 0],
            buff=0,
            color=self.colors["success"],
        )
        top_b = Arrow(
            [-1.55, 1.25, 0],
            [-0.2, 1.25, 0],
            buff=0,
            color=self.colors["success"],
        )
        long_arrow = Arrow(
            [-2.9, 1.25, 0],
            [-0.2, 1.25, 0],
            buff=0,
            color=self.colors["success"],
            stroke_width=6,
        )
        reinforce = self._text(
            "reinforce",
            24,
            color=self.colors["success"],
            weight="BOLD",
        ).move_to([3.2, 1.25, 0])
        bottom_a = Arrow(
            [-2.9, -1.05, 0],
            [-1.15, -1.05, 0],
            buff=0,
            color=self.colors["danger"],
        )
        bottom_b = Arrow(
            [-1.15, -1.05, 0],
            [-2.9, -1.05, 0],
            buff=0,
            color=self.colors["danger"],
        )
        cancelled = Dot(
            [-2.9, -1.05, 0],
            radius=0.13,
            color=self.colors["danger"],
        )
        cancel_label = self._text(
            "cancel",
            24,
            color=self.colors["danger"],
            weight="BOLD",
        ).move_to([3.2, -1.05, 0])
        result_group = VGroup(
            top_label,
            bottom_label,
            long_arrow,
            reinforce,
            cancelled,
            cancel_label,
        )
        steps = [
            transition,
            Step(
                0.75,
                (
                    FadeIn(top_label),
                    FadeIn(bottom_label),
                    GrowArrow(top_a),
                    GrowArrow(top_b),
                    GrowArrow(bottom_a),
                    GrowArrow(bottom_b),
                ),
            ),
            Step(
                0.9,
                (
                    FadeOut(top_a),
                    FadeOut(top_b),
                    FadeIn(long_arrow),
                    FadeOut(bottom_a),
                    FadeOut(bottom_b),
                    FadeIn(cancelled),
                ),
            ),
            Step(0.55, (FadeIn(reinforce), FadeIn(cancel_label))),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = result_group

    def _beat_bits_vs_qubits_measurement(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        token_circle = Circle(
            radius=0.62,
            stroke_color=self.colors["brand"],
            stroke_width=2.4,
            fill_color=self.colors["brand"],
            fill_opacity=0.13,
        )
        token_text = self._text("|ψ⟩", 30, color=self.colors["brand"])
        token = VGroup(token_circle, token_text).move_to([-3.45, 0.25, 0])
        meter = self._meter([0, 0.25, 0])
        bit_card, _, _ = self._bit_card(
            "0",
            [3.45, 0.25, 0],
            width=2.1,
            height=1.75,
        )
        histogram = self._shot_histogram((21, 19), guide=True)
        histogram_group = VGroup(
            histogram["frame"],
            histogram["dots"],
            histogram["counter"],
        )
        steps = [
            transition,
            Step(
                0.65,
                (FadeIn(token), FadeIn(meter), FadeIn(bit_card)),
            ),
            Step(0.8, (token.animate.move_to(meter.get_center()),)),
            Step(
                0.55,
                (
                    FadeOut(token, scale=0.3),
                    bit_card.animate.shift(RIGHT * 0.25),
                ),
            ),
            Step(0.48, (FadeOut(meter), FadeOut(bit_card))),
            Step(
                0.62,
                (
                    FadeIn(histogram["frame"]),
                    FadeIn(histogram["counter"]),
                ),
            ),
            Step(
                2.45,
                (
                    histogram["animation"],
                    histogram["tracker"].animate.set_value(
                        histogram["total"]
                    ),
                ),
                linear,
            ),
        ]
        self._run_beat(frame_count, steps)
        histogram["counter"][1].clear_updaters()
        self.remove(histogram["tracker"])
        self.current_visual = histogram_group

    def _beat_bits_vs_qubits_outro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        bit_card = RoundedRectangle(
            width=4.3,
            height=2.15,
            corner_radius=0.2,
            stroke_color=self.colors["muted"],
            stroke_width=1.5,
            fill_color="#0d1728",
            fill_opacity=0.94,
        ).move_to([-3.2, -0.05, 0])
        bit_text = self._wrap_text(
            "Bit: one definite value",
            3.5,
            (29, 27, 25),
            2,
            weight="BOLD",
        ).move_to(bit_card)
        qubit_card = bit_card.copy().move_to([3.2, -0.05, 0])
        qubit_text = self._wrap_text(
            "Qubit: amplitudes that interfere",
            3.55,
            (29, 27, 25),
            2,
            weight="BOLD",
        ).move_to(qubit_card)
        cards = VGroup(bit_card, bit_text, qubit_card, qubit_text)
        your_turn = self._text(
            "Your turn",
            46,
            color=self.colors["brand"],
            weight="BOLD",
        ).move_to([0, 1.75, 0])
        steps = [
            transition,
            Step(0.72, (FadeIn(cards),)),
            Step(
                0.72,
                (
                    self.quanta.animate.set_height(1.1).move_to(
                        [0, -1.58, 0]
                    ),
                ),
            ),
            Step(0.3, (self.quanta.animate.shift(UP * 0.28),)),
            Step(0.3, (self.quanta.animate.shift(DOWN * 0.28),)),
            Step(0.52, (FadeIn(your_turn, shift=UP * 0.15),)),
        ]
        self._run_beat(frame_count, steps, bob_quanta=False)
        self.current_visual = VGroup(cards, your_turn)

    def _beat_reading_the_charts_intro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        self._title_intro(beat, frame_count)

    def _beat_reading_the_charts_circuit(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        wire = self._wire([0, -0.05, 0])
        gate = self._gate_tile("H", [0.6, 1.9, 0])
        panel = RoundedRectangle(
            width=7.7,
            height=1.05,
            corner_radius=0.16,
            stroke_color=self.colors["muted"],
            stroke_width=1.2,
            fill_color="#0c1626",
            fill_opacity=0.93,
        ).move_to([0, 2.35, 0])
        panel.set_opacity(0)
        self.add(panel)
        circuit = VGroup(wire["group"], gate)
        steps = [
            transition,
            Step(
                0.6,
                (
                    FadeIn(wire["q"]),
                    FadeIn(wire["state"]),
                    Create(wire["line"]),
                ),
            ),
            Step(0.35, (FadeIn(gate, shift=UP * 0.45),)),
            Step(
                0.45,
                (
                    gate.animate.move_to([0.55, -0.05, 0]).scale(1.08),
                ),
            ),
            Step(0.2, (gate.animate.scale(1 / 1.08),)),
            Step(0.25, (panel.animate.set_opacity(0.93),)),
            Step(
                0.8,
                (
                    wire["group"].animate.scale(0.55).move_to([0, 2.35, 0]),
                    gate.animate.scale(0.55).move_to([0.55, 2.35, 0]),
                ),
            ),
        ]
        self._run_beat(frame_count, steps)
        top_strip = VGroup(panel, circuit)
        self.state["top_strip"] = top_strip
        self.state["top_wire"] = circuit
        self.state["h_gate"] = circuit[1]
        self.current_visual = None

    def _beat_reading_the_charts_probabilities(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        chart = self._two_bar_chart(
            (1.0, 0.0),
            ("100%", "0%"),
            "Probabilities",
            self.colors["success"],
        ).scale(0.9)
        chart.move_to([0, -0.25, 0])
        target = self._two_bar_chart(
            (0.5, 0.5),
            ("50%", "50%"),
            "Probabilities",
            self.colors["success"],
        ).scale(0.9)
        target.move_to([0, -0.25, 0])
        sum_label = self._text(
            "50% + 50% = 100%",
            25,
            color=self.colors["success"],
            weight="BOLD",
        ).move_to([4.55, -0.25, 0])
        sum_line = Line(
            [2.35, -1.25, 0],
            [2.35, 0.75, 0],
            color=self.colors["success"],
            stroke_width=2,
        )
        summary = VGroup(sum_line, sum_label)
        steps = [
            transition,
            Step(0.65, (FadeIn(chart),)),
            Step(1.05, (Transform(chart, target),)),
            Step(0.55, (Create(sum_line), FadeIn(sum_label))),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = VGroup(chart, summary)
        self.state["probability_chart"] = chart

    def _beat_reading_the_charts_phase(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        chart = self.state["probability_chart"]
        summary = self.current_visual[1]
        transition = self._transition(beat["caption"], clear_current=False)
        dial_zero = self._phase_dial([2.35, 0.55, 0], "|0⟩")
        dial_one = self._phase_dial([4.35, 0.55, 0], "|1⟩")
        z_gate = self._gate_tile(
            "Z",
            [1.3, 2.35, 0],
            width=0.52,
            height=0.46,
            color=self.colors["warning"],
        )
        h_gate = self.state["h_gate"]
        z_gate.next_to(h_gate, RIGHT, buff=0.23)
        unchanged = self._text(
            "unchanged",
            21,
            color=self.colors["success"],
            weight="BOLD",
        ).move_to([-2.75, -1.65, 0])
        degree_180 = self._text(
            "180°",
            20,
            color=self.colors["warning"],
        ).move_to(dial_one["degree"])
        steps = [
            transition,
            Step(
                0.72,
                (
                    chart.animate.scale(0.72).move_to([-2.8, -0.1, 0]),
                    FadeOut(summary[0]),
                    FadeOut(summary[1]),
                    FadeIn(dial_zero["group"]),
                    FadeIn(dial_one["group"]),
                    FadeIn(z_gate),
                ),
            ),
            Step(
                0.95,
                (
                    Rotate(
                        dial_one["pointer"],
                        angle=PI,
                        about_point=dial_one["circle"].get_center(),
                    ),
                    Transform(dial_one["degree"], degree_180),
                ),
                linear,
            ),
            Step(
                0.7,
                (
                    Indicate(chart, color=self.colors["success"], scale_factor=1.04),
                    FadeIn(unchanged),
                ),
            ),
        ]
        self._run_beat(frame_count, steps)
        self.state["z_gate"] = z_gate
        self.current_visual = VGroup(
            chart,
            dial_zero["group"],
            dial_one["group"],
            unchanged,
        )

    def _beat_reading_the_charts_bloch(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        bloch = self._bloch_sphere([0, -0.55, 0], equator_labels=True)
        h_gate = self.state["h_gate"]
        z_gate = self.state["z_gate"]
        group = VGroup(bloch["sphere"], bloch["arrow"])
        steps = [
            transition,
            Step(
                0.72,
                (FadeIn(bloch["sphere"]), GrowArrow(bloch["arrow"])),
            ),
            Step(
                1.0,
                (
                    Circumscribe(h_gate, color=self.colors["brand"]),
                    Rotate(
                        bloch["arrow"],
                        angle=-PI / 2,
                        about_point=bloch["center"],
                    ),
                ),
            ),
            Step(
                1.15,
                (
                    Circumscribe(z_gate, color=self.colors["warning"]),
                    Rotate(
                        bloch["arrow"],
                        angle=-PI,
                        about_point=bloch["center"],
                    ),
                ),
            ),
        ]
        self._run_beat(frame_count, steps)
        self.current_visual = group

    def _beat_reading_the_charts_outro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        top_panel, top_circuit = self.state["top_strip"]
        card_positions = (-3.75, 0.0, 3.75)
        cards = VGroup()
        card_labels = (
            "How often?",
            "How do paths combine?",
            "Where does it point?",
        )
        for index, (x, label) in enumerate(
            zip(card_positions, card_labels, strict=True)
        ):
            card = RoundedRectangle(
                width=3.35,
                height=2.25,
                corner_radius=0.18,
                stroke_color=self.colors["muted"],
                stroke_width=1.2,
                fill_color="#0d1728",
                fill_opacity=0.94,
            ).move_to([x, -0.4, 0])
            label_text = self._wrap_text(
                label,
                2.85,
                (22, 20, 18),
                2,
                color=self.colors["muted"],
                weight="BOLD",
            )
            label_text.move_to(card.get_bottom() + UP * 0.35)
            if index == 0:
                mini = self._two_bar_chart(
                    (0.5, 0.5),
                    ("50%", "50%"),
                    " ",
                    self.colors["success"],
                    compact=True,
                ).scale(0.42)
            elif index == 1:
                mini = self._phase_dial([0, 0, 0], "Phase")["group"].scale(0.7)
            else:
                bloch = self._bloch_sphere(
                    [0, 0, 0],
                    equator_labels=False,
                )
                mini = VGroup(
                    *bloch["sphere"].submobjects[:3],
                    bloch["arrow"],
                ).scale(0.43)
            mini.move_to(card.get_center() + UP * 0.28)
            cards.add(VGroup(card, mini, label_text))
        your_turn = self._text(
            "Your turn",
            42,
            color=self.colors["brand"],
            weight="BOLD",
        ).move_to([0, 1.55, 0])
        steps = [
            transition,
            Step(
                0.85,
                (
                    LaggedStart(*[FadeIn(card) for card in cards], lag_ratio=0.18),
                    FadeOut(top_panel),
                    FadeOut(top_circuit),
                    FadeOut(self.state["z_gate"]),
                ),
            ),
            Step(0.28, (self.quanta.animate.shift(UP * 0.28),)),
            Step(0.28, (self.quanta.animate.shift(DOWN * 0.28),)),
            Step(0.48, (FadeIn(your_turn),)),
        ]
        self._run_beat(frame_count, steps, bob_quanta=False)
        self.current_visual = VGroup(cards, your_turn)

    def _workspace(self) -> dict[str, Any]:
        def panel(
            title: str,
            width: float,
            height: float,
            center: Sequence[float],
        ) -> dict[str, Any]:
            box = RoundedRectangle(
                width=width,
                height=height,
                corner_radius=0.15,
                stroke_color=self.colors["muted"],
                stroke_width=1.25,
                fill_color="#0d1728",
                fill_opacity=0.92,
            ).move_to(center)
            title_text = self._text(
                title,
                17,
                color=self.colors["brand"],
                weight="BOLD",
            )
            title_text.move_to(box.get_top() + DOWN * 0.23)
            return {"group": VGroup(box, title_text), "box": box}

        gates = panel("Gates", 2.25, 3.05, [-4.75, 0.58, 0])
        canvas = panel("Canvas", 5.15, 3.05, [-0.83, 0.58, 0])
        inspector = panel("Inspector", 2.55, 3.05, [3.55, 0.58, 0])
        results = panel("Results", 5.1, 1.2, [-3.2, -1.76, 0])
        code = panel("Code", 5.1, 1.2, [2.25, -1.76, 0])

        gate_tiles = VGroup()
        labels = ("H", "X", "Y", "Z", "S", "T", "CX", "M")
        h_tile = None
        for index, label in enumerate(labels):
            row, column = divmod(index, 4)
            tile = self._gate_tile(
                label,
                [
                    -5.48 + column * 0.49,
                    0.88 - row * 0.58,
                    0,
                ],
                width=0.4,
                height=0.38,
                color=self.colors["brand"],
            )
            tile[1].scale_to_fit_width(0.25)
            gate_tiles.add(tile)
            if label == "H":
                h_tile = tile
        gates["group"].add(gate_tiles)

        wire = Line(
            [-2.68, 0.35, 0],
            [1.05, 0.35, 0],
            color=self.colors["foreground"],
            stroke_width=2.4,
        )
        wire_label = self._text("q[0]", 18, color=self.colors["muted"])
        wire_label.next_to(wire, LEFT, buff=0.2)
        canvas["group"].add(wire, wire_label)

        workspace_group = VGroup(
            gates["group"],
            canvas["group"],
            inspector["group"],
            results["group"],
            code["group"],
        )
        return {
            "group": workspace_group,
            "gates": gates,
            "canvas": canvas,
            "inspector": inspector,
            "results": results,
            "code": code,
            "h_tile": h_tile,
            "wire": wire,
        }

    def _beat_tour_the_build_workspace_intro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        self._title_intro(beat, frame_count)

    def _beat_tour_the_build_workspace_layout(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        workspace = self._workspace()
        time_arrow = Arrow(
            workspace["wire"].get_start(),
            workspace["wire"].get_start() + RIGHT * 0.65,
            buff=0,
            color=self.colors["warning"],
            stroke_width=4,
        )
        path = Line(
            workspace["wire"].get_start(),
            workspace["wire"].get_end() - RIGHT * 0.65,
        )
        steps = [
            transition,
            Step(
                0.95,
                (
                    LaggedStart(
                        *[
                            FadeIn(panel)
                            for panel in workspace["group"]
                        ],
                        lag_ratio=0.12,
                    ),
                ),
            ),
            Step(
                0.72,
                (
                    Circumscribe(
                        workspace["gates"]["box"],
                        color=self.colors["brand"],
                    ),
                ),
            ),
            Step(
                0.95,
                (
                    Circumscribe(
                        workspace["canvas"]["box"],
                        color=self.colors["brand"],
                    ),
                    FadeIn(time_arrow),
                ),
                linear,
            ),
            Step(0.82, (MoveAlongPath(time_arrow, path),), linear),
            Step(0.25, (FadeOut(time_arrow),)),
        ]
        self._run_beat(frame_count, steps)
        self.state["workspace"] = workspace
        self.current_visual = None

    def _beat_tour_the_build_workspace_place(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        workspace = self.state["workspace"]
        h_tile = workspace["h_tile"]
        cursor = Triangle(
            color=self.colors["foreground"],
            fill_color=self.colors["foreground"],
            fill_opacity=1,
        ).scale(0.15).rotate(-PI / 4)
        cursor.move_to(h_tile.get_center() + RIGHT * 0.2 + DOWN * 0.15)
        placed_h = h_tile.copy().scale(1.45)
        path = ArcBetweenPoints(
            h_tile.get_center(),
            [-0.75, 0.35, 0],
            angle=-PI / 3,
        )
        cursor_path = ArcBetweenPoints(
            cursor.get_center(),
            [-0.45, 0.1, 0],
            angle=-PI / 3,
        )
        steps = [
            transition,
            Step(0.42, (FadeIn(cursor),)),
            Step(0.38, (Indicate(h_tile, color=self.colors["brand"]),)),
            Step(0.48, (FadeIn(placed_h, scale=0.8),)),
            Step(
                1.0,
                (
                    MoveAlongPath(placed_h, path),
                    MoveAlongPath(cursor, cursor_path),
                ),
                linear,
            ),
            Step(0.28, (placed_h.animate.scale(1.12),)),
            Step(
                0.3,
                (
                    placed_h.animate.scale(1 / 1.12),
                    FadeOut(cursor),
                ),
            ),
        ]
        self._run_beat(frame_count, steps)
        self.state["placed_h"] = placed_h
        self.current_visual = None

    def _beat_tour_the_build_workspace_inspect(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        workspace = self.state["workspace"]
        placed_h = self.state["placed_h"]
        ring = SurroundingRectangle(
            placed_h,
            color=self.colors["brand"],
            buff=0.09,
            stroke_width=2.3,
        )
        rows = VGroup(
            self._text("Type: H", 17),
            self._text("Target: q[0]", 17),
            self._text("Column: 0", 17),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        rows.move_to([3.55, 0.35, 0])
        steps = [
            transition,
            Step(0.45, (FadeIn(ring),)),
            Step(
                0.6,
                (
                    Circumscribe(
                        workspace["inspector"]["box"],
                        color=self.colors["brand"],
                    ),
                ),
            ),
            Step(0.32, (Write(rows[0]),), linear),
            Step(0.32, (Write(rows[1]),), linear),
            Step(0.32, (Write(rows[2]),), linear),
        ]
        self._run_beat(frame_count, steps)
        self.state["selection_ring"] = ring
        self.state["inspector_rows"] = rows
        self.current_visual = None

    def _beat_tour_the_build_workspace_results(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        workspace = self.state["workspace"]
        tab = self._text(
            "Probabilities",
            15,
            color=self.colors["brand"],
            weight="BOLD",
        ).move_to([-4.25, -1.72, 0])
        bar_zero = Rectangle(
            width=0.48,
            height=0.05,
            stroke_color=self.colors["success"],
            fill_color=self.colors["success"],
            fill_opacity=0.75,
        ).move_to([-2.55, -1.95, 0])
        bar_one = bar_zero.copy().move_to([-1.65, -1.95, 0])
        target_zero = bar_zero.copy().stretch_to_fit_height(0.55)
        target_zero.move_to([-2.55, -1.72, 0])
        target_one = bar_one.copy().stretch_to_fit_height(0.55)
        target_one.move_to([-1.65, -1.72, 0])
        zero_label = self._text("|0⟩ 50%", 14).move_to([-2.55, -2.22, 0])
        one_label = self._text("|1⟩ 50%", 14).move_to([-1.65, -2.22, 0])
        result_visual = VGroup(
            tab,
            bar_zero,
            bar_one,
            zero_label,
            one_label,
        )
        steps = [
            transition,
            Step(
                0.6,
                (
                    Circumscribe(
                        workspace["results"]["box"],
                        color=self.colors["brand"],
                    ),
                    FadeIn(tab),
                    FadeIn(zero_label),
                    FadeIn(one_label),
                ),
            ),
            Step(
                0.82,
                (
                    Transform(bar_zero, target_zero),
                    Transform(bar_one, target_one),
                ),
            ),
        ]
        self._run_beat(frame_count, steps)
        self.state["results_visual"] = result_visual
        self.current_visual = None

    def _beat_tour_the_build_workspace_code(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        workspace = self.state["workspace"]
        placed_h = self.state["placed_h"]
        dim_line = self._text(
            "qc = QuantumCircuit(1)",
            14,
            color=self.colors["muted"],
            font="DejaVu Sans Mono",
        ).move_to([2.25, -1.65, 0])
        code_line = self._text(
            "qc.h(0)",
            17,
            color=self.colors["success"],
            font="DejaVu Sans Mono",
            weight="BOLD",
        ).move_to([2.25, -2.05, 0])
        connector = Line(
            placed_h.get_bottom(),
            code_line.get_top(),
            color=self.colors["brand"],
            stroke_width=1.4,
        ).set_opacity(0.7)
        code_visual = VGroup(dim_line, code_line, connector)
        steps = [
            transition,
            Step(
                0.55,
                (
                    Circumscribe(
                        workspace["code"]["box"],
                        color=self.colors["brand"],
                    ),
                    FadeIn(dim_line),
                ),
            ),
            Step(0.78, (Write(code_line),), linear),
            Step(0.55, (Create(connector),)),
        ]
        self._run_beat(frame_count, steps)
        self.state["code_visual"] = code_visual
        self.current_visual = None

    def _beat_tour_the_build_workspace_outro(
        self, beat: dict[str, str], frame_count: int
    ) -> None:
        transition = self._transition(beat["caption"])
        workspace = self.state["workspace"]
        fade_animations: list[Any] = [
            panel.animate.set_opacity(0.16)
            for panel in workspace["group"]
        ]
        for key in ("placed_h", "selection_ring"):
            mobject = self.state.get(key)
            if mobject is not None:
                fade_animations.append(mobject.animate.set_opacity(0.16))
        for key in ("inspector_rows", "results_visual", "code_visual"):
            group = self.state.get(key)
            if group is not None:
                fade_animations.extend(
                    item.animate.set_opacity(0.16) for item in group
                )
        your_turn = self._text(
            "Your turn",
            50,
            color=self.colors["brand"],
            weight="BOLD",
        ).move_to([1.2, 0.65, 0])
        chips = VGroup(
            *[
                RoundedRectangle(
                    width=1.65,
                    height=0.58,
                    corner_radius=0.16,
                    stroke_color=self.colors["brand"],
                    fill_color=self.colors["brand"],
                    fill_opacity=0.12,
                )
                for _ in range(3)
            ]
        ).arrange(RIGHT, buff=0.22)
        chip_labels = VGroup(
            *[
                self._text(label, 20, color=self.colors["brand"], weight="BOLD")
                for label in ("Place", "Select", "Inspect")
            ]
        )
        for chip, label in zip(chips, chip_labels, strict=True):
            label.move_to(chip)
        chip_group = VGroup(chips, chip_labels).move_to([1.2, -0.25, 0])
        steps = [
            transition,
            Step(
                0.7,
                tuple(
                    [
                        *fade_animations,
                        self.quanta.animate.set_height(1.55).move_to(
                            [-2.3, 0.1, 0]
                        ),
                    ]
                ),
            ),
            Step(0.3, (self.quanta.animate.shift(UP * 0.3),)),
            Step(0.3, (self.quanta.animate.shift(DOWN * 0.3),)),
            Step(0.58, (FadeIn(your_turn), FadeIn(chip_group))),
        ]
        self._run_beat(frame_count, steps, bob_quanta=False)
        self.current_visual = VGroup(your_turn, chip_group)


def main() -> None:
    args = parse_args()
    storyboards_path = args.storyboards.resolve()
    model_path = args.model.resolve()
    voices_path = args.voices.resolve()
    ensure_non_empty(storyboards_path)
    ensure_non_empty(model_path)
    ensure_non_empty(voices_path)
    data = load_storyboards(storyboards_path)
    out_dir = args.out.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    repo_root = Path(__file__).resolve().parents[2]

    lesson_by_id = {lesson["id"]: lesson for lesson in data["lessons"]}
    if args.lessons:
        selected_ids = [
            lesson_id.strip()
            for lesson_id in args.lessons.split(",")
            if lesson_id.strip()
        ]
    else:
        selected_ids = list(lesson_by_id)
    unknown = [lesson_id for lesson_id in selected_ids if lesson_id not in lesson_by_id]
    if unknown:
        raise ValueError(f"Unknown lesson ids: {', '.join(unknown)}")
    if not selected_ids:
        raise ValueError("No lessons selected")

    kokoro = Kokoro(str(model_path), str(voices_path))
    summary: dict[str, Any] = {
        "manimVersion": "0.19.0",
        "lessons": {},
    }
    for lesson_id in selected_ids:
        lesson_started = time.monotonic()
        lesson = lesson_by_id[lesson_id]
        narration_path, vtt_path, timings = synthesize_lesson(
            kokoro,
            lesson,
            args.voice_name,
            out_dir,
        )
        with tempfile.TemporaryDirectory(
            prefix=f"{lesson_id}-",
            dir=out_dir,
        ) as temporary:
            work_dir = Path(temporary)
            silent_video = render_silent_video(
                storyboards_path,
                lesson_id,
                timings,
                repo_root,
                work_dir,
            )
            output_path = out_dir / f"{lesson_id}.mp4"
            mux_lesson(silent_video, narration_path, output_path)
        elapsed = time.monotonic() - lesson_started
        total_audio_duration = sum(
            float(timing["audioDuration"]) for timing in timings
        )
        summary["lessons"][lesson_id] = {
            "video": str(output_path),
            "narration": str(narration_path),
            "captions": str(vtt_path),
            "audioDuration": total_audio_duration,
            "videoFrameDuration": sum(
                int(timing["frameCount"]) for timing in timings
            )
            / VIDEO_FPS,
            "renderSeconds": elapsed,
            "beats": timings,
        }
        print(
            f"{lesson_id}: rendered {output_path} in {elapsed:.1f}s",
            flush=True,
        )

    summary_path = out_dir / "render-summary.json"
    summary_path.write_text(
        json.dumps(summary, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {summary_path}", flush=True)


if __name__ == "__main__":
    main()
