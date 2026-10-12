#!/usr/bin/env python3
"""Render narrated lesson walkthroughs to MP4 and WebVTT."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from playwright.sync_api import sync_playwright


SCENE_PAUSE_SECONDS = 0.45
FADE_SECONDS = 0.015
AUDIO_SAMPLE_RATE = 24000
FRAME_WAIT_MS = 700
VIEWPORT = {"width": 1280, "height": 720}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--voices", required=True, type=Path)
    parser.add_argument("--voice-name", default="af_heart")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--lessons", help="Comma-separated lesson ids to render")
    return parser.parse_args()


def ensure_non_empty(path: Path) -> None:
    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError(f"Expected a non-empty file: {path}")


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
    kokoro: Kokoro,
    voice_name: str,
    speed: float,
    base_url: str,
    lesson_id: str,
    out_dir: Path,
    work_dir: Path,
    speech_clips: set[str],
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
    narration_chunks: list[np.ndarray] = []
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
        segment_path = lesson_work / f"scene-{index:03}.mp4"
        page.screenshot(path=str(frame_path), animations="disabled")
        ensure_non_empty(frame_path)

        samples, sample_rate = kokoro.create(
            scene["speech"],
            voice=voice_name,
            speed=speed,
            lang="en-us",
        )
        if sample_rate != AUDIO_SAMPLE_RATE:
            raise RuntimeError(
                f"Kokoro returned {sample_rate} Hz audio; "
                f"expected {AUDIO_SAMPLE_RATE} Hz"
            )
        clip = np.asarray(samples, dtype=np.float32)
        if clip.ndim != 1 or clip.size == 0:
            raise RuntimeError(
                f"Kokoro returned unexpected audio shape: {clip.shape}"
            )
        clip = clip.copy()
        fade_samples = min(
            int(sample_rate * FADE_SECONDS),
            clip.size // 2,
        )
        if fade_samples:
            clip[:fade_samples] *= np.linspace(
                0.0, 1.0, fade_samples, dtype=np.float32
            )
            clip[-fade_samples:] *= np.linspace(
                1.0, 0.0, fade_samples, dtype=np.float32
            )

        speech_clip_name = (
            "speech-"
            f"{hashlib.sha256(scene['speech'].encode('utf-8')).hexdigest()[:16]}"
            ".mp3"
        )
        speech_clip_path = out_dir / speech_clip_name
        speech_clips.add(speech_clip_name)
        if not speech_clip_path.exists():
            speech_wav_path = lesson_work / f"{speech_clip_name}.wav"
            sf.write(
                speech_wav_path,
                clip,
                sample_rate,
                format="WAV",
                subtype="PCM_16",
            )
            ensure_non_empty(speech_wav_path)
            run_ffmpeg(
                [
                    "ffmpeg",
                    "-y",
                    "-v",
                    "error",
                    "-i",
                    str(speech_wav_path),
                    "-codec:a",
                    "libmp3lame",
                    "-b:a",
                    "64k",
                    "-ac",
                    "1",
                    "-ar",
                    "24000",
                    str(speech_clip_path),
                ]
            )
        ensure_non_empty(speech_clip_path)

        speech_duration = clip.size / sample_rate
        scene_audio = np.concatenate(
            (
                clip,
                np.zeros(
                    int(sample_rate * SCENE_PAUSE_SECONDS),
                    dtype=np.float32,
                ),
            )
        )
        scene_duration = scene_audio.size / sample_rate
        narration_chunks.append(scene_audio)
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
                "-t",
                f"{scene_duration:.6f}",
                "-an",
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
                str(segment_path),
            ]
        )
        ensure_non_empty(segment_path)
        segment_files.append(segment_path)
        cue_text = " ".join(scene["caption"].split()).replace("-->", "—>")
        vtt_cues.extend(
            [
                str(index + 1),
                f"{vtt_time(video_time)} --> "
                f"{vtt_time(video_time + speech_duration)}",
                cue_text,
                "",
            ]
        )
        video_time += scene_duration
        print(
            f"{lesson_id}: scene {index + 1}/{len(scene_data)} "
            f"({speech_duration:.2f}s speech)",
            flush=True,
        )

    narration_path = lesson_work / "narration.wav"
    narration = np.concatenate(narration_chunks)
    sf.write(
        narration_path,
        narration,
        AUDIO_SAMPLE_RATE,
        format="WAV",
        subtype="PCM_16",
    )
    ensure_non_empty(narration_path)

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
            "-i",
            str(narration_path),
            "-map",
            "0:v",
            "-map",
            "1:a",
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
        "durationSec": round(narration.size / AUDIO_SAMPLE_RATE, 3),
        "scenes": len(scene_data),
    }


def main() -> int:
    args = parse_args()
    base_url = args.base_url.rstrip("/")
    if not base_url:
        raise ValueError("--base-url cannot be empty")
    ensure_non_empty(args.model)
    ensure_non_empty(args.voices)

    args.out.mkdir(parents=True, exist_ok=True)
    out_dir = args.out.resolve()
    work_dir = out_dir / ".work"
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir()

    try:
        kokoro = Kokoro(str(args.model), str(args.voices))
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
            speech_clips: set[str] = set()
            try:
                for lesson_id in requested:
                    rendered[lesson_id] = render_lesson(
                        page,
                        kokoro,
                        args.voice_name,
                        args.speed,
                        base_url,
                        lesson_id,
                        out_dir,
                        work_dir,
                        speech_clips,
                    )
            finally:
                context.close()
                browser.close()

        manifest = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "speechClips": sorted(speech_clips),
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
