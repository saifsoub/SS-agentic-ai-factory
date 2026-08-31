import os
import tempfile

import gradio as gr
import soundfile as sf
import torch
from transformers import pipeline

MODEL_ID = os.getenv("S_A2A_MODEL", "Qwen/Qwen2.5-Omni-3B")


def build_pipe():
    dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
    kwargs = {
        "task": "any-to-any",
        "model": MODEL_ID,
        "dtype": dtype,
    }
    if torch.cuda.is_available():
        kwargs["device_map"] = "auto"
    return pipeline(**kwargs)


PIPE = build_pipe()


def _content(prompt, image, audio, video):
    content = []
    if image:
        content.append({"type": "image", "path": image})
    if audio:
        content.append({"type": "audio", "path": audio})
    if video:
        content.append({"type": "video", "path": video})
    if prompt and prompt.strip():
        content.append({"type": "text", "text": prompt.strip()})
    if not content:
        content.append({"type": "text", "text": "Say hello and introduce yourself briefly."})
    return content


def run_agent(prompt, image, audio, video, output_mode):
    messages = [{"role": "user", "content": _content(prompt, image, audio, video)}]

    common = {
        "text": messages,
        "max_new_tokens": 256,
        "return_full_text": False,
    }
    if video:
        common.update({"fps": 1, "load_audio_from_video": True})

    if output_mode == "voice":
        result = PIPE(**common, generation_mode="audio")
        first = result[0] if isinstance(result, list) else result
        generated_audio = first.get("generated_audio") if isinstance(first, dict) else None
        generated_text = first.get("generated_text", "") if isinstance(first, dict) else str(first)
        if generated_audio is None:
            return generated_text or "Voice output was not returned by this model/runtime.", None

        audio_np = generated_audio.reshape(-1)
        if hasattr(audio_np, "detach"):
            audio_np = audio_np.detach().cpu().numpy()
        path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        sf.write(path, audio_np, 24000)
        return generated_text, path

    result = PIPE(**common)
    first = result[0] if isinstance(result, list) else result
    if isinstance(first, dict):
        return str(first.get("generated_text", first)), None
    return str(first), None


with gr.Blocks(title="S/A2A Agent") as demo:
    gr.Markdown(
        "# S/A2A Agent\n"
        "**Any input. One agent. Multiple ways to answer.**\n\n"
        f"Starter core: `{MODEL_ID}` on Hugging Face Transformers."
    )

    with gr.Row():
        with gr.Column(scale=1):
            prompt = gr.Textbox(label="Text", placeholder="Ask S/A2A anything…", lines=4)
            image = gr.Image(label="Image", type="filepath")
            audio = gr.Audio(label="Audio", type="filepath")
            video = gr.Video(label="Video")
            output_mode = gr.Radio(["text", "voice"], value="text", label="Output")
            send = gr.Button("Send to S/A2A", variant="primary")

        with gr.Column(scale=1):
            response = gr.Textbox(label="S/A2A response", lines=12)
            voice = gr.Audio(label="Voice response", autoplay=False)

    send.click(
        fn=run_agent,
        inputs=[prompt, image, audio, video, output_mode],
        outputs=[response, voice],
    )

    gr.Markdown(
        "### Next evolution\n"
        "Orb state • streaming speech • agent-to-agent routing • memory • tools • image/video generation adapters."
    )


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=int(os.getenv("PORT", "7860")))
