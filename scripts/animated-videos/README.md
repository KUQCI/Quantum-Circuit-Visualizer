# Animated lesson videos

The renderer uses Manim Community Edition and one continuous Kokoro narration
track per lesson. Bespoke Module 1 scenes coexist with generic, storyboard
driven `title`, `circuit`, `histogram`, `cards`, `code`, and `outro` beats.
Production storyboards live in `lib/learning/animated-storyboards.json`.

## System dependencies

On Ubuntu:

```bash
sudo apt-get install -y libcairo2-dev libpango1.0-dev pkg-config ffmpeg
```

Create a virtual environment and install the pinned Python packages:

```bash
python3 -m venv /home/ubuntu/manim-pilot/venv
/home/ubuntu/manim-pilot/venv/bin/pip install \
  -r scripts/animated-videos/requirements.txt
```

## Kokoro model files

Download the model and voices from the same pinned release used by the lesson
video workflow:

- `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx`
  - SHA-256: `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`
- `https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin`
  - SHA-256: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

## Render

Run from the repository root:

```bash
/home/ubuntu/manim-pilot/venv/bin/python \
  scripts/animated-videos/render.py --self-check

/home/ubuntu/manim-pilot/venv/bin/python \
  scripts/animated-videos/render.py \
  --out /home/ubuntu/manim-pilot/out \
  --model /home/ubuntu/vidcheck/kokoro-v1.0.onnx \
  --voices /home/ubuntu/vidcheck/voices-v1.0.bin
```

Use `--lessons what-is-a-qubit,bits-vs-qubits` to render only selected lesson
IDs, `--voice-name` to select a Kokoro voice (default `am_michael`),
`--speed` to adjust narration speed (default `0.95`), or `--storyboards <path>`
to use another storyboard file. The storyboard path defaults to
`lib/learning/animated-storyboards.json`.

Each lesson produces:

- `<id>.mp4`: 1280×720, 30 fps H.264 video with 48 kHz mono AAC audio
- `<id>-narration.wav`: the continuous 24 kHz mono PCM narration
- `<id>.vtt`: one caption cue per storyboard beat

`--self-check` validates the simulator's gate conventions, basis-label order,
Bloch vectors, and phase angles without requiring render or model arguments.
