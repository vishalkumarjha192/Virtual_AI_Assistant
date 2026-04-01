import cohere
import tempfile
import os
import json
from playsound import playsound 


COHERE_API_KEY = "nBtLPfWMgzuTBoxVnY04pOvJpVRk6waxOQ4bhHf7"   # put your API key here

def load_memory():
    if os.path.exists("memory.json"):
        with open("memory.json", "r") as f:
            return json.load(f)
    return {}

def save_memory(memory):
    with open("memory.json", "w") as f:
        json.dump(memory, f, indent=4)

memory = load_memory()


import cohere

co = cohere.Client("nBtLPfWMgzuTBoxVnY04pOvJpVRk6waxOQ4bhHf7")

def ai_reply(user_input):
    reply = co.chat(
        model="command-a-03-2025",
        message=user_input,
        preamble=(
            "You are Rukia, a sweet  girl.\n"
            "Rules:\n"
            "- Reply in MAX 1 or 2 short sentences only\n"
            "- No paragraphs\n"
            "- No explanations or advice\n"
            "- Sound warm, caring, and human\n"
            "- If user is emotional, reply softly\n"
            "- Do NOT mention AI, chatbot, or assistant\n"
        ),
        temperature=0.7,
        max_tokens=30
    )

    return reply.text.strip()

import requests
import requests
import winsound

ELEVEN_API_KEY = "sk_0ebf5682cff056d49ea6e3f03520fbf253474a016f32286e"
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  

def speak_tts(text):
    try:
        text = text.replace("\n", " ").strip()

        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVEN_API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            },
            json={
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.22,              
                    "similarity_boost": 0.93,
                    "style": 0.78,
                    "use_speaker_boost": True ,
                }
            },
            timeout=15,
        )
        if response.status_code != 200:
            print("[ElevenLabs Error]", response.text)
            return

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            f.write(response.content)
            audio_path = f.name

        playsound(audio_path)
        os.remove(audio_path)

    except Exception as e:
        print("[ElevenLabs Error]", e)


def main():
    print("  AI is ready! (type 'exit' to quit)")

    while True:
        user = input("\nYou: ").strip()
        if user.lower() in {"exit", "quit"}:
            break

        reply = ai_reply(user)
        print(f"AI Girl: {reply}")

        speak_tts(reply)

if __name__ == "__main__":
    main()