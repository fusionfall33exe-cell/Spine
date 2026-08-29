# Spine

A native desktop chat client for local LLMs, built on top of [Ollama](https://ollama.com). Built with Tauri + React.

Spine gives you a proper interface for models you're already running locally — model switching, live performance stats, a system resource monitor, and a settings panel for tuning inference on the fly, all without leaving your machine.

## Features

- **Model switcher** — swap between installed models, and pull new ones straight from the UI
- **Live performance stats** — tokens/sec, time-to-first-token, prompt/generation timing breakdown, per-session summaries
- **System monitor** — CPU, RAM, per-core usage, and the Ollama process's own resource footprint, live
- **Settings** — light/dark/system theme, and sliders for context length, temperature, and max output tokens
- **Markdown + syntax highlighting** in responses

## Requirements

- [Ollama](https://ollama.com) installed and running (`ollama serve`)
- A Debian-based Linux distribution (developed and tested on Debian Trixie)

Spine talks to Ollama's local API at `http://127.0.0.1:11434` — that's the default Ollama already uses, so if `ollama serve` is running, there's nothing extra to configure.

## Install

No pre-built releases yet — build from source for now.

### Build from source

Prerequisites:

- Node.js + npm
- Rust (via [rustup](https://rustup.rs))
- Tauri's Linux system dependencies:

  ```bash
  sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev libayatana-appindicator3-dev patchelf
  ```

Then:

```bash
git clone https://github.com/fusionfall33exe-cell/spine.git
cd spine
npm install
npm run tauri build
```

The installable package lands in `src-tauri/target/release/bundle/`. Install the `.deb`:

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/Spine_*.deb
```

or run the `.AppImage` in the `appimage/` folder directly — no install needed.

## Development

```bash
npm run tauri dev
```

## Notes

- Everything runs locally through your own Ollama instance. Spine doesn't send anything anywhere else.
- Settings overrides (context length, temperature, max output tokens) apply only within the app for the current session — they never modify your saved Ollama models.

## License

MIT — see [LICENSE](LICENSE).
