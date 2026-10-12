#!/usr/bin/env python3
"""Render narrated lesson walkthroughs to MP4 and WebVTT."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from piper import PiperVoice
from playwright.sync_api import sync_playwright


SCENE_PADDING_SECONDS = 0.6
FRAME_WAIT_MS = 700
VIEWPORT = {"width": 1280, "height": 720}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--voice", required=True, type=Path)
    parser.add_argument("--lessons", help="Comma-separated lesson ids to render")
    return parser.parse_args()


def ensure_non_empty(path: Path) -> None:
    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError(f"Expected a non-empty file: {path}")


def wav_duration(path: Path) -> float:
    ensure_non_empty(path)
    with wave.open(str(path), "rb") as wav_file:
        if wav_file.getnframes() == 0 or wav_file.getframerate() == 0:
            raise RuntimeError(f"Audio file contains no samples: {path}")
        return wav_file.getnframes() / wav_file.getframerate()


def vtt_time(seconds: float) -> str:
    total_ms = round(seconds * 1000)
    hours, remainder = divmod(total_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{whole_seconds:02}.{milliseconds:03}"


def run_ffmpeg(command: list[str], cwd: Path | None = None) -> None:
    result = subprocess.run(
        command,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise RuntimeError(
            f"ffmpeg failed ({result.returncode}):\n{result.stderr[-4000:]}"
        )


def render_lesson(
    page,
    voice: PiperVoice,
    base_url: str,
    lesson_id: str,
    out_dir: Path,
    work_dir: Path,
) -> dict[str, object]:
    lesson_work = work_dir / lesson_id
    lesson_work.mkdir(parents=True, exist_ok=True)
    lesson_url = (
        f"{base_url}/walkthrough-video/?lesson={quote(lesson_id, safe='')}"
    )
    page.goto(lesson_url, wait_until="domcontentloaded", timeout=120_000)
    page.wait_for_function(
        "(lessonId) => window.__qcvWalkthrough?.lessonId === lessonId",
        arg=lesson_id,
        timeout=60_000,
    )
    scene_data = page.evaluate("() => window.__qcvWalkthrough.scenes")
    if not scene_data:
        raise RuntimeError(f"Lesson {lesson_id} has no walkthrough scenes")

    segment_files: list[Path] = []
    vtt_cues: list[str] = []
    video_time = 0.0
    for index, scene in enumerate(scene_data):
        if not scene.get("speech", "").strip():
            raise RuntimeError(f"Lesson {lesson_id} scene {index} has no speech")

        page.evaluate(
            "(index) => window.__qcvWalkthrough.setScene(index)", index
        )
        page.wait_for_function(
            "(index) => document.body.dataset.walkthroughScene === String(index)",
            arg=index,
            timeout=10_000,
        )
        page.wait_for_timeout(FRAME_WAIT_MS)

        frame_path = lesson_work / f"scene-{index:03}.png"
        audio_path = lesson_work / f"scene-{index:03}.wav"
        segment_path = lesson_work / f"scene-{index:03}.mp4"
        page.screenshot(path=str(frame_path), animations="disabled")
        ensure_non_empty(frame_path)

        with wave.open(str(audio_path), "wb") as wav_file:
            voice.synthesize_wav(scene["speech"], wav_file)
        duration = wav_duration(audio_path)
        segment_duration = duration + SCENE_PADDING_SECONDS
        run_ffmpeg(
            [
                "ffmpeg",
                "-y",
                "-loop",
                "1",
                "-framerate",
                "30",
                "-i",
                str(frame_path),
                "-i",
                str(audio_path),
                "-t",
                f"{segment_duration:.3f}",
                "-c:v",
                "libx264",
                "-tune",
                "stillimage",
                "-preset",
                "medium",
                "-crf",
                "28",
                "-pix_fmt",
                "yuv420p",
                "-r",
                "30",
                "-c:a",
                "aac",
                "-b:a",
                "96k",
                "-ar",
                "48000",
                "-ac",
                "1",
                "-af",
                "apad",
                str(segment_path),
            ]
        )
        ensure_non_empty(segment_path)
        segment_files.append(segment_path)
        cue_text = " ".join(scene["caption"].split()).replace("-->", "—>")
        vtt_cues.extend(
            [
                str(index + 1),
                f"{vtt_time(video_time)} --> {vtt_time(video_time + duration)}",
                cue_text,
                "",
            ]
        )
        video_time += segment_duration
        print(
            f"{lesson_id}: scene {index + 1}/{len(scene_data)} "
            f"({duration:.2f}s speech)",
            flush=True,
        )

    concat_path = lesson_work / "concat.txt"
    concat_path.write_text(
        "".join(f"file '{segment.name}'\n" for segment in segment_files),
        encoding="utf-8",
    )
    video_path = out_dir / f"{lesson_id}.mp4"
    run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_path),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(video_path),
        ],
        cwd=lesson_work,
    )
    ensure_non_empty(video_path)

    vtt_path = out_dir / f"{lesson_id}.vtt"
    vtt_path.write_text("WEBVTT\n\n" + "\n".join(vtt_cues), encoding="utf-8")
    ensure_non_empty(vtt_path)
    return {
        "file": video_path.name,
        "vtt": vtt_path.name,
        "durationSec": round(video_time, 3),
        "scenes": len(scene_data),
    }


def main() -> int:
    args = parse_args()
    base_url = args.base_url.rstrip("/")
    if not base_url:
        raise ValueError("--base-url cannot be empty")
    ensure_non_empty(args.voice)
    voice_config = Path(f"{args.voice}.json")
    ensure_non_empty(voice_config)

    args.out.mkdir(parents=True, exist_ok=True)
    out_dir = args.out.resolve()
    work_dir = out_dir / ".work"
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir()

    try:
        voice = PiperVoice.load(args.voice)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(
                viewport=VIEWPORT,
                device_scale_factor=1,
                reduced_motion="reduce",
                color_scheme="dark",
            )
            page = context.new_page()
            page.goto(
                f"{base_url}/walkthrough-video/",
                wait_until="domcontentloaded",
                timeout=120_000,
            )
            page.wait_for_function(
                "() => Array.isArray(window.__qcvWalkthrough?.lessonIds)",
                timeout=60_000,
            )
            all_lessons = page.evaluate(
                "() => window.__qcvWalkthrough.lessonIds"
            )
            requested = (
                [item.strip() for item in args.lessons.split(",") if item.strip()]
                if args.lessons
                else all_lessons
            )
            unknown = [item for item in requested if item not in all_lessons]
            if unknown:
                raise ValueError(f"Unknown lesson ids: {', '.join(unknown)}")
            if not requested:
                raise ValueError("No lessons selected")

            rendered: dict[str, object] = {}
            try:
                for lesson_id in requested:
                    rendered[lesson_id] = render_lesson(
                        page,
                        voice,
                        base_url,
                        lesson_id,
                        out_dir,
                        work_dir,
                    )
            finally:
                context.close()
                browser.close()

        manifest = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "lessons": rendered,
        }
        (out_dir / "lesson-videos.json").write_text(
            json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
        )
        ensure_non_empty(out_dir / "lesson-videos.json")
        return 0
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"lesson video rendering failed: {error}", file=sys.stderr)
        sys.exit(1)
