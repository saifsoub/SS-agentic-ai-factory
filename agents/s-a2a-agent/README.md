# S/A2A Agent

**S/A2A = Seif Any-to-Any Agent.**

Starter multimodal agent inside the SS Agentic AI Factory.

## Mission

One agent surface that can accept **text, image, audio, and video** and route them through an any-to-any multimodal core, then grow into richer **text + voice + media + action** outputs.

## Starter core

- Hugging Face task: `any-to-any`
- Starter model: `Qwen/Qwen2.5-Omni-3B`
- Framework: Hugging Face Transformers
- UI: Gradio starter shell

Hugging Face's current Transformers any-to-any guide uses `Qwen/Qwen2.5-Omni-3B` with `AutoModelForMultimodalLM` / `pipeline("any-to-any")`, so this is a clean baseline rather than a one-off custom stack.

## Run

```bash
cd agents/s-a2a-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

> GPU recommended. The model is multimodal and heavier than a text-only chat model.

## Superstar roadmap

1. **Perception** — text, image, audio, video in one conversation.
2. **Expression** — text + natural speech first; image/video generation adapters next.
3. **Orb UX** — one living state indicator for listening, thinking, speaking, and acting.
4. **A2A routing** — delegate specialist tasks to other agents/tools behind one personality.
5. **Memory + context** — persistent project and user context with explicit controls.
6. **Evaluation** — latency, modality success rate, tool success rate, and user delight checks.

## Files

- `app.py` — first Gradio multimodal shell.
- `requirements.txt` — minimal runtime dependencies.
- `SYSTEM.md` — behavior and product contract for S/A2A.
