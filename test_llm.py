import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from experiential_client import call_gpt6_astra, MODEL_NAME, BASE_URL


def main():
    print(f"Connecting to Experiential Gateway: {BASE_URL}")
    print(f"Target Model: {MODEL_NAME}")
    print("Sending test request...")

    try:
        response = call_gpt6_astra(
            messages=[
                {
                    "role": "user",
                    "content": "Hello! Confirm you are gpt-6-astra running on Experiential gateway in one short sentence.",
                }
            ]
        )

        reply = response.choices[0].message.content
        usage = response.usage

        print("\n=== Model Response ===")
        print(reply)
        print("\n=== Token Usage (Experiential Credits) ===")
        if usage:
            print(f"Prompt Tokens: {usage.prompt_tokens}")
            print(f"Completion Tokens: {usage.completion_tokens}")
            print(f"Total Tokens: {usage.total_tokens}")
        else:
            print("No usage metadata returned.")

    except Exception as e:
        print(f"\nAPI Call Failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
