# Changelog

All notable changes to Spine will be documented in this file.

## [1.1.0] - 2026-08-30

### Added

- CPU temperature in the system monitor, read via `sysinfo`'s hardware sensor support (Intel `coretemp` package temp, AMD `k10temp` Tctl/Tdie) — shown next to CPU usage, matching how GPU temperature already appears next to GPU usage

## [1.0.0] - 2026-08-29

First release.

### Added

- Model switcher — swap between installed Ollama models, pull new ones from the UI
- Live performance stats — tokens/sec, time-to-first-token, prompt/generation timing breakdown, per-session summaries
- System monitor — GPU utilization/VRAM/temperature (NVIDIA via `nvidia-smi`, AMD via `rocm-smi`), CPU, RAM, per-core usage, and the Ollama process's own resource footprint
- Settings panel — light/dark/system theme, configurable Ollama server URL, and session-scoped inference overrides (context length, temperature, max output tokens) that never touch the saved model's own configuration
- Markdown and syntax highlighting in responses
