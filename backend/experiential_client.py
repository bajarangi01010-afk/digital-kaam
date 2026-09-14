import os
import sys
from openai import OpenAI

MODEL_NAME = "gpt-6-astra"
BASE_URL = "https://api.experientiallabs.ai/v1"


def get_llm_client() -> OpenAI:
    """Builds and returns an OpenAI client configured for the Experiential gateway."""
    api_key = os.environ.get("EXPLABS_API_KEY")
    if not api_key:
        print(
            "ERROR: EXPLABS_API_KEY is not set.\n"
            "Please create an API key under Settings -> API keys in your Experiential Labs dashboard "
            "and export it (e.g., $env:EXPLABS_API_KEY=\"your_key\").",
            file=sys.stderr,
        )
        sys.exit(1)

    return OpenAI(
        base_url=BASE_URL,
        api_key=api_key,
    )


def call_gpt6_astra(messages, stream: bool = False, tools=None, **kwargs):
    """Makes a chat completion call to gpt-6-astra via Experiential gateway."""
    client = get_llm_client()
    call_kwargs = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": stream,
        **kwargs,
    }
    if tools is not None:
        call_kwargs["tools"] = tools

    return client.chat.completions.create(**call_kwargs)
