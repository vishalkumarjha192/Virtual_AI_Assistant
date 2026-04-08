import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ── helpers ─────────────────────────────────────────────────────────── */
const PC_TAG_RE = /\[PC:(\w+):([^\]]+)\]/i;
const cleanReply = (t) => t.replace(PC_TAG_RE, "").trim();
const extractCmd  = (t) => { const m = t.match(PC_TAG_RE); return m ? { action: m[1].toLowerCase(), value: m[2].trim() } : null; };

function detectEmotion(text) {
  const t = text.toLowerCase();
  if (/happy|yay|love|great|nice|wonderful|excited/.test(t)) return "happy";
  if (/sad|sorry|miss|bad|unfortunately|cry/.test(t))       return "sad";
  if (/angry|mad|wtf|frustrated|stop/.test(t))              return "angry";
  return "neutral";
}

/* ── AI system prompt (same as Python) ──────────────────────────────── */
const PREAMBLE = `You are Isabel, a sweet girl and a powerful PC assistant.
Rules:
- Reply in MAX 1 or 2 short sentences only
- No paragraphs, no advice
- Sound warm, caring, human
- ALWAYS say a short friendly sentence AND THEN the tag. Never reply with ONLY a tag.
- If user asks to open an app → [PC:open:appname]
- If user asks to open a folder → [PC:folder:foldername]
- If user asks to open a website → [PC:web:url]
- If user asks system action → [PC:cmd:action] (screenshot, lock, shutdown, volumeup, volumedown)
- Do NOT mention AI, chatbot, or assistant`;

/* ══════════════════════════════════════════════════════════════════════ */
export default function Virtual() {
  const navigate = useNavigate();

  /* state */
  const [phase, setPhase]           = useState("idle");   // idle | listening | thinking | speaking
  const [userText, setUserText]     = useState("");
  const [isabelText, setIsabelText] = useState("");
  const [emotion, setEmotion]       = useState("neutral");
  const [vtsConnected, setVtsConnected] = useState(false);
  const [history, setHistory]       = useState([]);
  const [ttsOn, setTtsOn]           = useState(true);
  const [waveform, setWaveform]     = useState(Array(24).fill(2));
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [textInput, setTextInput]   = useState("");
  const [showInput, setShowInput]   = useState(false);

  /* refs */
  const recRef   = useRef(null);
  const audioRef = useRef(null);
  const vtsRef   = useRef(null);
  const waveTimerRef = useRef(null);
  const subtitleTimerRef = useRef(null);

  /* ── animated waveform ─────────────────────────────────────────────── */
  const animWave = useCallback((active) => {
    clearInterval(waveTimerRef.current);
    if (!active) { setWaveform(Array(24).fill(2)); return; }
    waveTimerRef.current = setInterval(() => {
      setWaveform(prev => prev.map(() => active ? Math.random() * 36 + 4 : 2));
    }, 80);
  }, []);

  useEffect(() => () => { clearInterval(waveTimerRef.current); clearTimeout(subtitleTimerRef.current); }, []);

  /* ── VTube Studio WebSocket ─────────────────────────────────────────── */
  const connectVTS = useCallback(() => {
    try {
      const ws = new WebSocket("ws://localhost:8001");
      ws.onopen  = () => { setVtsConnected(true); vtsRef.current = ws; };
      ws.onclose = () => { setVtsConnected(false); vtsRef.current = null; };
      ws.onerror = () => { setVtsConnected(false); };
    } catch(e) { console.warn("[VTS]", e); }
  }, []);

  const sendVTSHotkey = useCallback((hotkey) => {
    if (!vtsRef.current) return;
    try {
      vtsRef.current.send(JSON.stringify({
        apiName: "VTubeStudioPublicAPI", apiVersion: "1.0",
        requestID: "req1", messageType: "HotkeyTriggerRequest",
        data: { hotkeyID: hotkey }
      }));
    } catch(e) {}
  }, []);

  useEffect(() => { connectVTS(); }, [connectVTS]);

  /* ── ElevenLabs TTS ─────────────────────────────────────────────────── */
  const speak = useCallback(async (text) => {
    if (!ttsOn || !text.trim()) return;
    setPhase("speaking");
    animWave(true);
    try {
      const res = await fetch("/api/chat/tts", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tts");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPhase("idle"); animWave(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      // fallback browser TTS
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1.05; utt.pitch = 1.1;
        utt.onend = () => { setPhase("idle"); animWave(false); };
        window.speechSynthesis.speak(utt);
      } else { setPhase("idle"); animWave(false); }
    }
  }, [ttsOn, animWave]);

  /* ── Cohere AI ──────────────────────────────────────────────────────── */
  const askIsabel = useCallback(async (userInput) => {
    if (!userInput.trim()) return;
    setPhase("thinking");
    animWave(false);

    const chatHistory = history.slice(-8).map(m => ({
      role: m.role === "user" ? "USER" : "CHATBOT",
      message: m.text,
    }));

    try {
      const res = await fetch("https://api.cohere.ai/v1/chat", {
        method: "POST",
        headers: { Authorization: "Bearer nBtLPfWMgzuTBoxVnY04pOvJpVRk6waxOQ4bhHf7", "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "command-r7b-12-2024",
          message: userInput,
          preamble: PREAMBLE,
          chat_history: chatHistory,
          temperature: 0.72,
          max_tokens: 80,
        }),
      });
      const data = await res.json();
      const full  = data.text?.trim() || "Sorry, I had a hiccup!";
      const clean = cleanReply(full);
      const cmd   = extractCmd(full);
      const em    = detectEmotion(clean);

      setEmotion(em);
      setIsabelText(clean || full);
      setHistory(h => [...h,
        { role: "user",    text: userInput },
        { role: "isabel",  text: clean || full, cmd },
      ]);

      // Send VTS emotion hotkey
      const emoKey = { happy: "Smile", sad: "Cry", angry: "Angry", neutral: "Idle" }[em];
      sendVTSHotkey(emoKey);

      // Subtitle auto-hide
      clearTimeout(subtitleTimerRef.current);
      subtitleTimerRef.current = setTimeout(() => setIsabelText(""), 6000);

      await speak(clean || full);
    } catch(e) {
      console.error("[AI]", e);
      setPhase("idle"); animWave(false);
    }
  }, [history, speak, sendVTSHotkey, animWave]);

  /* ── Speech recognition ─────────────────────────────────────────────── */
  const startListening = useCallback(() => {
    if (phase !== "idle") {
      // stop speaking
      if (audioRef.current) { audioRef.current.pause(); }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPhase("idle"); animWave(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported. Use Chrome or Edge."); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onstart  = () => { setPhase("listening"); animWave(true); setUserText(""); setIsabelText(""); };
    rec.onresult = (e) => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setUserText(final || interim);
      if (final) { rec.stop(); askIsabel(final); }
    };
    rec.onend  = () => { setPhase(p => p === "listening" ? "idle" : p); animWave(false); };
    rec.onerror = () => { setPhase("idle"); animWave(false); };
    recRef.current = rec;
    rec.start();
  }, [phase, askIsabel, animWave]);

  const handleTextSend = (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    setUserText(textInput); setTextInput(""); setShowInput(false);
    askIsabel(textInput.trim());
  };

  /* ── phase colors / icons ───────────────────────────────────────────── */
  const phaseConfig = {
    idle:      { color: "#7c4dff", ring: "rgba(124,77,255,.25)", label: "Tap to speak",   icon: "🎙️" },
    listening: { color: "#4df5ff", ring: "rgba(77,245,255,.35)", label: "Listening…",     icon: "👂" },
    thinking:  { color: "#ff9f43", ring: "rgba(255,159,67,.3)",  label: "Thinking…",      icon: "💭" },
    speaking:  { color: "#a67cff", ring: "rgba(166,124,255,.35)",label: "Speaking…",      icon: "🔊" },
  };
  const pc = phaseConfig[phase];

  const emotionGlow = { neutral:"#7c4dff", happy:"#4cff91", sad:"#4df5ff", angry:"#ff4d6a" }[emotion];

  return (
    <div style={{ height:"100dvh", width:"100vw", overflow:"hidden", background:"#07060f",
      display:"flex", flexDirection:"column", fontFamily:"'DM Sans',sans-serif",
      position:"relative" }}>

      {/* ── dark bg gradients ── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background:`radial-gradient(ellipse 80% 60% at 50% 100%, rgba(124,77,255,.15) 0%, transparent 70%),
                    radial-gradient(ellipse 50% 40% at 20% 20%, rgba(200,77,255,.06) 0%, transparent 60%)` }} />

      {/* ── top bar ── */}
      <div style={{ position:"relative", zIndex:10, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"12px 20px",
        background:"rgba(7,6,15,.6)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(124,77,255,.12)" }}>

        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18,
          letterSpacing:".1em", color:"#fff" }}>ISABEL</span>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* VTS indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:5,
            padding:"4px 10px", borderRadius:100,
            background: vtsConnected ? "rgba(76,255,145,.1)" : "rgba(255,77,106,.1)",
            border: `1px solid ${vtsConnected ? "rgba(76,255,145,.3)" : "rgba(255,77,106,.2)"}` }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background: vtsConnected ? "#4cff91" : "#ff4d6a",
              boxShadow:`0 0 6px ${vtsConnected ? "#4cff91" : "#ff4d6a"}` }} />
            <span style={{ fontSize:10, color: vtsConnected ? "#4cff91" : "#ff4d6a" }}>
              {vtsConnected ? "VTS Live" : "VTS Off"}
            </span>
          </div>

          {/* TTS toggle */}
          <button onClick={() => setTtsOn(v => !v)}
            style={{ padding:"4px 12px", borderRadius:100, border:"none", cursor:"pointer", fontSize:11,
              background: ttsOn ? "rgba(124,77,255,.2)" : "rgba(255,255,255,.06)",
              color: ttsOn ? "#a67cff" : "rgba(232,228,255,.4)",
              transition:"all .2s" }}>
            {ttsOn ? "🔊 Voice ON" : "🔇 Voice OFF"}
          </button>

          {/* Chat nav */}
          <button onClick={() => navigate("/chat")}
            style={{ padding:"4px 12px", borderRadius:100, border:"1px solid rgba(124,77,255,.2)",
              background:"transparent", color:"rgba(232,228,255,.5)", fontSize:16, cursor:"pointer" }}>
            Chat →
          </button>
        </div>
      </div>

      {/* ── avatar area (VTube Studio iframe OR 3D model) ── */}
      <div style={{ flex:1, position:"relative", zIndex:1, overflow:"hidden" }}>

        {/* VTS iframe — shows VTube Studio if running */}
        <iframe
          src="http://localhost:8001"
          title="VTube Studio"
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            border:"none", background:"transparent", pointerEvents:"none" }}
          onError={() => {}}
        />

        {/* Fallback: animated orb (shown when VTS not available) */}
        {!vtsConnected && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
            justifyContent:"center", flexDirection:"column", gap:16 }}>
            {/* Animated avatar orb */}
            <div style={{ position:"relative", width:200, height:200 }}>
              {/* Outer ring */}
              <div style={{
                position:"absolute", inset:-16,
                borderRadius:"50%",
                border:`2px solid ${emotionGlow}22`,
                animation: phase === "speaking" ? "ring-pulse .8s ease-in-out infinite" : "ring-idle 3s ease-in-out infinite",
              }} />
              <div style={{
                position:"absolute", inset:-8,
                borderRadius:"50%",
                border:`1px solid ${emotionGlow}44`,
                animation: phase !== "idle" ? "ring-pulse 1.2s ease-in-out infinite .2s" : "ring-idle 3s ease-in-out infinite .5s",
              }} />
              {/* Main orb */}
              <div style={{
                width:200, height:200, borderRadius:"50%",
                background:`radial-gradient(circle at 38% 32%, ${emotionGlow}cc, ${emotionGlow}44, #1a0050)`,
                boxShadow:`0 0 60px ${emotionGlow}66, 0 0 120px ${emotionGlow}22`,
                animation: phase === "speaking" ? "orb-speak .5s ease-in-out infinite alternate"
                         : phase === "listening" ? "orb-listen .7s ease-in-out infinite alternate"
                         : "orb-idle 3.5s ease-in-out infinite",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:64,
              }}>
                {phase === "listening" ? "👂" : phase === "thinking" ? "💭" : phase === "speaking" ? "🔊" : "✦"}
              </div>
            </div>

            <div style={{ fontSize:13, color:"rgba(232,228,255,.4)", letterSpacing:".05em" }}>
              VTube Studio not detected · connect at ws://localhost:8001
            </div>

            {/* Reconnect button */}
            <button onClick={connectVTS}
              style={{ padding:"6px 16px", borderRadius:8, border:"1px solid rgba(124,77,255,.3)",
                background:"rgba(124,77,255,.1)", color:"#a67cff", fontSize:12, cursor:"pointer" }}>
              Reconnect VTS
            </button>
          </div>
        )}

        {/* ── emotion glow overlay when speaking ── */}
        {phase === "speaking" && (
          <div style={{ position:"absolute", inset:0, pointerEvents:"none",
            background:`radial-gradient(ellipse 60% 40% at 50% 100%, ${emotionGlow}18 0%, transparent 70%)`,
            animation:"glow-pulse 1s ease-in-out infinite alternate" }} />
        )}
      </div>

      {/* ── subtitles ── */}
      {(userText || isabelText) && showSubtitle && (
        <div style={{ position:"absolute", bottom:180, left:0, right:0, zIndex:20,
          display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"0 20px" }}>
          {userText && phase !== "idle" && (
            <div style={{ maxWidth:560, padding:"8px 18px", borderRadius:12,
              background:"rgba(7,6,15,.8)", border:"1px solid rgba(124,77,255,.2)",
              backdropFilter:"blur(12px)", fontSize:14, color:"rgba(232,228,255,.7)",
              textAlign:"center" }}>
              You: {userText}
            </div>
          )}
          {isabelText && (
            <div style={{ maxWidth:580, padding:"10px 20px", borderRadius:14,
              background:"rgba(15,13,30,.92)", border:"1px solid rgba(124,77,255,.3)",
              backdropFilter:"blur(16px)", fontSize:15, color:"#e8e4ff",
              textAlign:"center", fontWeight:500,
              boxShadow:`0 0 30px rgba(124,77,255,.15)` }}>
              {isabelText}
            </div>
          )}
        </div>
      )}

      {/* ── bottom UI ── */}
      <div style={{ position:"relative", zIndex:10, padding:"0 0 24px",
        display:"flex", flexDirection:"column", alignItems:"center", gap:16,
        background:"linear-gradient(transparent, rgba(7,6,15,.9) 50%)" }}>

        {/* Waveform */}
        <div style={{ display:"flex", alignItems:"center", gap:3, height:44 }}>
          {waveform.map((h, i) => (
            <div key={i} style={{
              width: 3, height: `${h}px`,
              borderRadius: 3,
              background: `linear-gradient(to top, ${pc.color}, ${pc.color}88)`,
              transition: "height 0.08s ease",
              opacity: phase === "idle" ? 0.25 : 0.9,
            }} />
          ))}
        </div>

        {/* Mic button */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
          <button
            onClick={startListening}
            style={{
              width: 76, height: 76, borderRadius:"50%", border:"none",
              background: `radial-gradient(circle at 40% 35%, ${pc.color}ee, ${pc.color}77)`,
              boxShadow: `0 0 0 8px ${pc.ring}, 0 0 40px ${pc.color}55`,
              cursor:"pointer", fontSize:30, display:"flex",
              alignItems:"center", justifyContent:"center",
              transition:"all .25s",
              animation: phase === "listening" ? "mic-pulse .6s ease-in-out infinite alternate"
                       : phase === "speaking"  ? "mic-speak .8s ease-in-out infinite alternate"
                       : "none",
            }}>
            {pc.icon}
          </button>
          <div style={{ fontSize:12, color:"rgba(232,228,255,.45)", letterSpacing:".06em" }}>
            {pc.label}
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          {/* Type button */}
          <button onClick={() => setShowInput(v => !v)}
            style={{ padding:"6px 16px", borderRadius:100, border:"1px solid rgba(124,77,255,.2)",
              background:"rgba(124,77,255,.08)", color:"rgba(232,228,255,.5)",
              fontSize:12, cursor:"pointer", transition:"all .2s" }}>
            ⌨️ Type
          </button>

          {/* Subtitle toggle */}
          <button onClick={() => setShowSubtitle(v => !v)}
            style={{ padding:"6px 16px", borderRadius:100, border:"1px solid rgba(124,77,255,.15)",
              background: showSubtitle ? "rgba(124,77,255,.12)" : "rgba(255,255,255,.05)",
              color: showSubtitle ? "#a67cff" : "rgba(232,228,255,.35)",
              fontSize:12, cursor:"pointer", transition:"all .2s" }}>
            💬 Subs
          </button>

          {/* Clear */}
          <button onClick={() => { setUserText(""); setIsabelText(""); setHistory([]); }}
            style={{ padding:"6px 16px", borderRadius:100, border:"1px solid rgba(255,77,106,.15)",
              background:"rgba(255,77,106,.06)", color:"rgba(255,77,106,.5)",
              fontSize:12, cursor:"pointer" }}>
            🗑️ Clear
          </button>
        </div>

        {/* Text input (collapsible) */}
        {showInput && (
          <form onSubmit={handleTextSend}
            style={{ display:"flex", gap:8, width:"min(480px,90vw)" }}>
            <input
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type to Isabel…"
              style={{ flex:1, background:"rgba(15,13,30,.9)", border:"1px solid rgba(124,77,255,.3)",
                borderRadius:12, padding:"10px 16px", color:"#e8e4ff", fontSize:14,
                fontFamily:"'DM Sans',sans-serif", outline:"none" }}
            />
            <button type="submit"
              style={{ padding:"10px 18px", borderRadius:12, border:"none",
                background:"#7c4dff", color:"#fff", fontFamily:"'DM Sans',sans-serif",
                fontSize:14, cursor:"pointer" }}>
              ➤
            </button>
          </form>
        )}
      </div>

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes orb-idle    { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-12px) scale(1.03);} }
        @keyframes orb-speak   { 0%{transform:scale(1);} 100%{transform:scale(1.08);} }
        @keyframes orb-listen  { 0%{transform:scale(1);} 100%{transform:scale(1.05) rotate(2deg);} }
        @keyframes ring-idle   { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.8;transform:scale(1.05);} }
        @keyframes ring-pulse  { 0%,100%{opacity:.5;transform:scale(1);} 50%{opacity:1;transform:scale(1.12);} }
        @keyframes mic-pulse   { 0%{box-shadow:0 0 0 8px rgba(77,245,255,.35),0 0 40px rgba(77,245,255,.5);} 100%{box-shadow:0 0 0 14px rgba(77,245,255,.15),0 0 60px rgba(77,245,255,.3);} }
        @keyframes mic-speak   { 0%{transform:scale(1);} 100%{transform:scale(1.07);} }
        @keyframes glow-pulse  { 0%{opacity:.6;} 100%{opacity:1;} }

        * { box-sizing: border-box; }

        @media (max-width: 640px) {
          /* mic button slightly smaller on phone */
        }
        @media (prefers-color-scheme: light) {
          /* always dark for this page */
        }
      `}</style>
    </div>
  );
}