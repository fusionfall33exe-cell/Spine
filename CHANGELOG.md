# Changelog

All notable changes to Spine will be documented in this file.

## [1.0.0] - 2026-08-29

First release.

### Added

- Model switcher — swap between installed Ollama models, pull new ones from the UI
- Live performance stats — tokens/sec, time-to-first-token, prompt/generation timing breakdown, per-session summaries
- System monitor — GPU utilization/VRAM/temperature (NVIDIA via `nvidia-smi`, AMD via `rocm-smi`), CPU, RAM, per-core usage, and the Ollama process's own resource footprint
- Settings panel — light/dark/system theme, configurable Ollama server URL, and session-scoped inference overrides (context length, temperature, max output tokens) that never touch the saved model's own configuration
- Markdown and syntax highlighting in responses
