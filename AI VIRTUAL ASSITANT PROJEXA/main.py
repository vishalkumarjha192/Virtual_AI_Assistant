import cohere
import tempfile
import os
import json
import subprocess
import threading
import glob
import requests
import sounddevice as sd
import numpy as np
from faster_whisper import WhisperModel
import wave
import time
import re
import winreg
import shutil
import websocket

COHERE_API_KEY  = "nBtLPfWMgzuTBoxVnY04pOvJpVRk6waxOQ4bhHf7"
ELEVEN_API_KEY  = "sk_0ebf5682cff056d49ea6e3f03520fbf253474a016f32286e"
VOICE_ID        = "EXAVITQu4vr4xnSDxMaL"

SAMPLERATE      = 16000
SILENCE_THRESH  = 300
SILENCE_SECS    = 1.2
MAX_SECS        = 15
#  VTube Studio Connectio
VTS_WS = None

def connect_vts():
    global VTS_WS
    try:
        VTS_WS = websocket.create_connection("ws://localhost:8001")
        print(" Connected to VTube Studio")
    except Exception as e:
        print(" VTS connection failed:", e)

def send_expression(hotkey):
    global VTS_WS
    if not VTS_WS:
        return
    try:
        payload = {
            "apiName": "VTubeStudioPublicAPI",
            "apiVersion": "1.0",
            "requestID": "1",
            "messageType": "HotkeyTriggerRequest",
            "data": {
                "hotkeyID": hotkey
            }
        }
        VTS_WS.send(json.dumps(payload))
    except Exception as e:
        print("[VTS Error]", e)
def load_memory():
    if os.path.exists("memory.json"):
        with open("memory.json", "r") as f:
            return json.load(f)
    return {}

def save_memory(memory):
    with open("memory.json", "w") as f:
        json.dump(memory, f, indent=4)

memory = load_memory()


co = cohere.Client(COHERE_API_KEY)

PREAMBLE = (
    "You are Isabel, a sweet girl and a powerful PC assistant.\n"
    "Rules:\n"
    "- Reply in MAX 1 or 2 short sentences only\n"
    "- No paragraphs, no advice\n"
    "- Sound warm, caring, human\n"
    "- ALWAYS say a short friendly sentence AND THEN the tag. Never reply with ONLY a tag.\n"
    "- If user asks to open an app → [PC:open:appname]\n"
    "- If user asks to open a folder → [PC:folder:foldername]\n"
    "- If user asks to open a website → [PC:web:url]\n"
    "- If user asks system action → [PC:cmd:action]\n"
    "- Examples:\n"
    "    'open chrome'        → Opening Chrome for you! [PC:open:chrome]\n"
    "    'open spotify'       → Let's get your music going! [PC:open:spotify]\n"
    "    'open notepad'       → Sure thing! [PC:open:notepad]\n"
    "    'open downloads'     → Here you go! [PC:folder:downloads]\n"
    "    'open youtube'       → Opening YouTube! [PC:web:youtube.com]\n"
    "    'take screenshot'    → Done! [PC:cmd:screenshot]\n"
    "    'lock screen'        → Locking your PC! [PC:cmd:lock]\n"
    "    'shutdown'           → Shutting down in 30s! [PC:cmd:shutdown]\n"
    "    'volume up'          → Turning it up! [PC:cmd:volumeup]\n"
    "- Do NOT mention AI, chatbot, or assistant\n"
)

def ai_reply(user_input: str) -> str:
    full_text = ""
    try:
        for event in co.chat_stream(
            model="command-r7b-12-2024",   # FAST model
            message=user_input,
            preamble=PREAMBLE,
            temperature=0.7,
            max_tokens=60,
        ):
            if hasattr(event, "text") and event.text:
                full_text += event.text
        return full_text.strip()
    except Exception:
        try:
            reply = co.chat(
                model="command-r7b-12-2024",
                message=user_input,
                preamble=PREAMBLE,
                temperature=0.7,
                max_tokens=60,
            )
            return reply.text.strip()
        except Exception as e:
            print(f"[AI Error] {e}")
            return "Sorry, I had a hiccup!"

def find_app(name: str):

    name_lower = name.lower()

    
    found = shutil.which(name_lower) or shutil.which(name_lower + ".exe")
    if found:
        return found, "exe"

    for reg_root in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
        for reg_path in [
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths",
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths",
        ]:
            try:
                key = winreg.OpenKey(reg_root, reg_path)
                count = winreg.QueryInfoKey(key)[0]
                for i in range(count):
                    subkey_name = winreg.EnumKey(key, i)
                    if name_lower in subkey_name.lower():
                        try:
                            subkey = winreg.OpenKey(key, subkey_name)
                            path, _ = winreg.QueryValueEx(subkey, "")
                            path = path.strip('"').strip()
                            if os.path.exists(path):
                                return path, "exe"
                        except Exception:
                            pass
            except Exception:
                pass

    
    start_menus = [
        os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs"),
        r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs",
    ]
    for folder in start_menus:
        if not os.path.exists(folder):
            continue
        for lnk in glob.glob(os.path.join(folder, "**", "*.lnk"), recursive=True):
            if name_lower in os.path.basename(lnk).lower():
                return lnk, "lnk"

    
    search_dirs = [
        r"C:\Program Files",
        r"C:\Program Files (x86)",
        os.path.join(os.path.expanduser("~"), "AppData", "Local"),
        os.path.join(os.path.expanduser("~"), "AppData", "Roaming"),
        os.path.join(os.path.expanduser("~"), "AppData", "Local", "Programs"),
    ]
    skip_keywords = ["uninstall", "update", "crash", "helper", "setup", "redist", "vcredist"]
    for base in search_dirs:
        if not os.path.exists(base):
            continue
        try:
            for exe in glob.glob(os.path.join(base, "**", f"*{name_lower}*.exe"), recursive=True):
                exe_lower = exe.lower()
                if not any(s in exe_lower for s in skip_keywords):
                    return exe, "exe"
        except Exception:
            pass

    return None, None


FOLDER_MAP = {
    "downloads":  os.path.join(os.path.expanduser("~"), "Downloads"),
    "documents":  os.path.join(os.path.expanduser("~"), "Documents"),
    "pictures":   os.path.join(os.path.expanduser("~"), "Pictures"),
    "music":      os.path.join(os.path.expanduser("~"), "Music"),
    "videos":     os.path.join(os.path.expanduser("~"), "Videos"),
    "desktop":    os.path.join(os.path.expanduser("~"), "Desktop"),
}

def _take_screenshot():
    try:
        from PIL import ImageGrab
        img = ImageGrab.grab()
        path = os.path.join(os.path.expanduser("~"), "Desktop", "screenshot.png")
        img.save(path)
        print(f"[Screenshot saved → {path}]")
    except Exception as e:
        print(f"[Screenshot error] {e}")

def handle_pc_command(tag: str) -> str:
    match = re.search(r'\[PC:(\w+):(.+?)\]', tag)
    if not match:
        return ""

    action = match.group(1).lower()
    value  = match.group(2).strip().lower()

    try:
        
        if action == "open":
            path, kind = find_app(value)
            if path:
                if kind == "lnk":
                    os.startfile(path)
                else:
                    subprocess.Popen(f'"{path}"', shell=True)
                print(f"[Opened: {path}]")
                return f"Opening {value}!"
            else:
                print(f"[App not found: {value}]")
                return f"Couldn't find {value} on your PC."

        
        elif action == "folder":
            path = FOLDER_MAP.get(value, os.path.join(os.path.expanduser("~"), value.capitalize()))
            os.startfile(path)
            return f"Opening {value} folder!"

        
        elif action == "file":
            os.startfile(value)
            return "Opening file!"

        
        elif action == "web":
            import webbrowser
            url = value if value.startswith("http") else "https://" + value
            webbrowser.open(url)
            return f"Opening {value}!"

        
        elif action == "cmd":
            cmd_map = {
                "screenshot": _take_screenshot,
                "shutdown":   lambda: os.system("shutdown /s /t 30"),
                "restart":    lambda: os.system("shutdown /r /t 30"),
                "lock":       lambda: os.system("rundll32.exe user32.dll,LockWorkStation"),
                "volumeup":   lambda: os.system("nircmd.exe changesysvolume 6000"),
                "volumedown": lambda: os.system("nircmd.exe changesysvolume -6000"),
                "mute":       lambda: os.system("nircmd.exe mutesysvolume 1"),
                "unmute":     lambda: os.system("nircmd.exe mutesysvolume 0"),
            }
            fn = cmd_map.get(value)
            if fn:
                fn()
            else:
                subprocess.Popen(value, shell=True)
            return "Done!"

    except Exception as e:
        print(f"[PC Error] {e}")
        return "Couldn't do that, sorry."

    return ""

def extract_pc_tag(reply: str):
    match = re.search(r'\[PC:\w+:[^\]]+\]', reply)
    return match.group(0) if match else None

def clean_reply(reply: str) -> str:
    return re.sub(r'\[PC:[^\]]+\]', '', reply).strip()


def speak_tts(text: str):
    text = text.replace("\n", " ").strip()
    if not text:
        return
    try:
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVEN_API_KEY,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {
                    "stability": 0.22,
                    "similarity_boost": 0.93,
                    "style": 0.78,
                    "use_speaker_boost": True,
                },
                "optimize_streaming_latency": 4,
            },
            timeout=10,
        )
        if response.status_code != 200:
            print("[ElevenLabs Error]", response.text)
            return

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            f.write(response.content)
            audio_path = f.name

        try:
            import pygame
            pygame.mixer.init()
            pygame.mixer.music.load(audio_path)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                time.sleep(0.05)
            pygame.mixer.quit()
        except ImportError:
            from playsound import playsound
            playsound(audio_path)

        os.remove(audio_path)

    except Exception as e:
        print("[ElevenLabs Error]", e)


model_whisper = WhisperModel("base", device="cpu", compute_type="int8_float32")

def listen_from_mic() -> str | None:
    print("🎤 Listening... (auto-stops when you finish)")

    chunk_size     = int(SAMPLERATE * 0.1)
    max_chunks     = int(MAX_SECS / 0.1)
    silence_chunks = int(SILENCE_SECS / 0.1)
    audio_chunks   = []
    silent_count   = 0
    speech_started = False

    with sd.InputStream(samplerate=SAMPLERATE, channels=1, dtype="int16", blocksize=chunk_size) as stream:
        for _ in range(max_chunks):
            chunk, _ = stream.read(chunk_size)
            rms = int(np.sqrt(np.mean(chunk.astype(np.float32) ** 2)))
            if rms > SILENCE_THRESH:
                speech_started = True
                silent_count   = 0
                audio_chunks.append(chunk.copy())
            elif speech_started:
                audio_chunks.append(chunk.copy())
                silent_count += 1
                if silent_count >= silence_chunks:
                    break

    if not audio_chunks or not speech_started:
        print("  Didn't hear anything")
        return None

    audio = np.concatenate(audio_chunks, axis=0).flatten()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        wav_path = tmp.name

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLERATE)
        wf.writeframes(audio.tobytes())

    segments, _ = model_whisper.transcribe(
        wav_path, language="en", vad_filter=True, beam_size=1, best_of=1,
    )
    text = "".join(seg.text for seg in segments).strip()

    try:
        os.remove(wav_path)
    except Exception:
        pass

    if text:
        print(f"You: {text}")
        return text

    print("  Couldn't understand")
    return None
def detect_emotion(text: str) -> str:
    t = text.lower()

    if any(x in t for x in ["happy", "yay", "love", "great", "nice"]):
        return "Smile"
    if any(x in t for x in ["sad", "sorry", "miss", "bad"]):
        return "Cry"
    if any(x in t for x in ["angry", "mad", "wtf"]):
        return "Angry"

    return "Idle"

def main():
    
    print("=" * 50)
    print("  Isabel AI — Ready!")
    print("  Press ENTER to speak | Type message | 'exit' to quit")
    print("=" * 50)
    connect_vts()
    while True:
        try:
            user = input("\nPress ENTER for mic OR type: ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if user.lower() in {"exit", "quit"}:
            print("Bye!")
            break

        if user == "":
            user = listen_from_mic()
            if not user:
                continue

        t0    = time.time()
        reply = ai_reply(user)
        emotion = detect_emotion(reply)
        send_expression(emotion)
        print(f"Isabel: {reply}  ({time.time()-t0:.2f}s)")

        pc_tag     = extract_pc_tag(reply)
        speak_text = clean_reply(reply)

        if pc_tag:
            pc_thread = threading.Thread(target=handle_pc_command, args=(pc_tag,), daemon=True)
            pc_thread.start()

        if speak_text:
            speak_tts(speak_text)

        if pc_tag:
            pc_thread.join(timeout=5)

if __name__ == "__main__":
    main()
