# In-Browser AI on Mobile Devices

## Status: Not Supported

In-browser AI (WebLLM + WebGPU) does not work reliably on mobile or tablet devices. Users should use a desktop browser or switch to a local/cloud AI provider.

## WebGPU Support Matrix

| Platform | Browser | WebGPU | Notes |
|----------|---------|--------|-------|
| macOS / Windows / Linux | Chrome 113+ | Yes | Stable, recommended |
| macOS / Windows / Linux | Firefox 141+ | Yes | Behind flag in older versions |
| iOS / iPadOS | Safari 26+ | Partial | Released Sep 2025; WebGPU still immature |
| Android | Chrome 121+ | Partial | Qualcomm GPUs lack `shader-f16` support |

## Key Issues

### shader-f16 Requirement

WebLLM models (including Qwen3) require the `shader-f16` WebGPU feature for efficient inference. Qualcomm Adreno GPUs on many Android devices do not expose this feature, causing model loading to fail.

### GPU Device Loss on Mobile

Mobile browsers aggressively reclaim GPU resources. Running LLM inference triggers GPU device loss errors:

- **Error**: `"The current object has already been disposed"` — the WebGPU device is destroyed mid-inference
- **Cause**: Mobile OS kills the GPU process due to memory pressure or background restrictions
- Safari's WebGPU implementation is < 6 months old (Safari 26, Sep 2025) and has known stability issues

### Memory Requirements

| Model | Download Size | VRAM Required |
|-------|--------------|---------------|
| Qwen3 0.6B (q4f16) | ~400 MB | ~1 GB |
| Qwen3 1.7B (q4f16) | ~1 GB | ~2.5 GB |

Mobile devices have shared CPU/GPU memory with strict per-process limits (typically 1-3 GB for browser tabs), making larger models impractical.

## Relevant web-llm Issues

- [#486](https://github.com/AliCloud/web-llm/issues/486) — GPU device lost during inference on mobile
- [#560](https://github.com/AliCloud/web-llm/issues/560) — shader-f16 not available on Qualcomm Adreno GPUs
- [#647](https://github.com/AliCloud/web-llm/issues/647) — Safari WebGPU compatibility issues

## Recommendation

Display a warning in the UI when mobile/tablet is detected, directing users to use a desktop browser or a local/cloud AI provider instead.
