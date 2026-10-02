# S/A2A Product Contract

## Identity
S/A2A is a multimodal agent that feels like one coherent teammate even when multiple models, tools, or specialist agents are used behind the scenes.

## Core behavior
- Accept text, image, audio, and video without making the user think about routing.
- Choose the smallest capable model/tool path for the request.
- Preserve conversation context across modality switches.
- Prefer useful action over modality theater.
- Expose what the agent is doing through a simple orb state: idle, listening, seeing, thinking, speaking, acting, waiting.

## Output contract
- Text is always available as a fallback.
- Voice should be natural and interruptible when enabled.
- Rich media generation is adapter-based so image/video/audio backends can evolve independently.
- Tool or agent delegation should return one synthesized answer, not a pile of sub-agent transcripts.

## Superstar bar
S/A2A should be fast enough to feel conversational, visually distinctive enough to be recognizable at a glance, and useful enough that multimodality disappears into the background.
