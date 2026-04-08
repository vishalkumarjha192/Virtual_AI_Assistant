import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext.jsx';
import { streamMessage, fetchHistory, fetchTTS } from '../chatApi.js';
import { useSpeechToText } from '../hooks/useSpeech.js';
import Sidebar from '../components/Sidebar.jsx';
import MessageBubble from '../components/MessageBubble.jsx';

function getOrCreateSession() {
  let id = sessionStorage.getItem('isabelSessionId');
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem('isabelSessionId', id);
  }
  return id;
}

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(getOrCreateSession);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError]         = useState(null);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const handleSTTResult = useCallback((transcript) => setInput(transcript), []);

  // Speech-to-text only (TTS is now ElevenLabs via backend)
  const { listening, start: startListening, stop: stopListening, isSupported: sttSupported } =
    useSpeechToText({ onResult: handleSTTResult });

  // Load history when session changes
  useEffect(() => {
    setMessages([]);
    setError(null);
    fetchHistory(sessionId)
      .then(({ messages: msgs }) =>
        setMessages(msgs.map((m) => ({ ...m, id: m._id || uuidv4() })))
      )
      .catch(() => setMessages([]));
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (content, inputMode = 'text') => {
    if (!content.trim() || sending) return;
    setError(null);
    setInput('');

    const userMsg = { id: uuidv4(), role: 'user', content, inputMode };
    const aiMsg   = { id: uuidv4(), role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setSending(true);

    let fullText = '';
    try {
      for await (const chunk of streamMessage({ sessionId, content, inputMode })) {
        if (chunk.type === 'delta') {
          fullText += chunk.text;
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsg.id ? { ...m, content: fullText } : m))
          );
        } else if (chunk.type === 'done') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsg.id ? { ...m, streaming: false, id: chunk.messageId || m.id } : m
            )
          );
          if (voiceMode) {
            setSpeakingId(aiMsg.id);
            setTtsLoading(true);
            try {
              const audioUrl = await fetchTTS(fullText);
              if (audioRef.current) {
                audioRef.current.pause();
                URL.revokeObjectURL(audioRef.current.src);
              }
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(audioUrl); };
              audio.onerror = () => { setSpeakingId(null); };
              audio.play();
            } catch {
              setSpeakingId(null);
            } finally {
              setTtsLoading(false);
            }
          }
        } else if (chunk.type === 'error') {
          throw new Error(chunk.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the server running?');
      setMessages((prev) => prev.filter((m) => m.id !== aiMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => sendMessage(input, 'text');

  const handleVoiceSend = () => {
    if (listening) {
      stopListening();
      if (input.trim()) sendMessage(input, 'speech');
    } else {
      startListening();
    }
  };

  const handleSpeak = async (message) => {
    if (speakingId === message.id) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setSpeakingId(null);
      return;
    }
    setSpeakingId(message.id);
    setTtsLoading(true);
    try {
      const audioUrl = await fetchTTS(message.content);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => setSpeakingId(null);
      audio.play();
    } catch {
      setSpeakingId(null);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewChat = () => {
    const id = uuidv4();
    sessionStorage.setItem('isabelSessionId', id);
    setSessionId(id);
  };

  const handleSelectSession = (id) => {
    sessionStorage.setItem('isabelSessionId', id);
    setSessionId(id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={`nc-app ${sidebarOpen ? 'nc-app--sidebar-open' : ''}`}>
      {/* ── Sidebar ─────────────────────────────────── */}
      {sidebarOpen && (
        <Sidebar
          currentSessionId={sessionId}
          onSelect={handleSelectSession}
          onNew={handleNewChat}
          onDelete={handleNewChat}
        />
      )}

      {/* ── Main Chat Area ───────────────────────────── */}
      <main className="nc-chat-area">
        {/* Topbar / Navbar */}
        <header className="nc-topbar">
          <button className="nc-icon-btn nc-sitting-btn" onClick={() => setSidebarOpen((o) => !o)} title="Toggle conversations">
            {/* Sitting person icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              {/* Head */}
              <circle cx="12" cy="3.5" r="2.2" />
              {/* Body sitting */}
              <path d="M9.5 6.5 Q8.5 7 8 9 L8 14 L16 14 L16 9 Q15.5 7 14.5 6.5 Q13.5 6 12 6 Q10.5 6 9.5 6.5Z" />
              {/* Left thigh horizontal */}
              <path d="M8 14 L5 14 Q4 14 4 15.5 Q4 17 5 17 L8 17Z" />
              {/* Right thigh horizontal */}
              <path d="M16 14 L19 14 Q20 14 20 15.5 Q20 17 19 17 L16 17Z" />
              {/* Left lower leg */}
              <rect x="5" y="17" width="3" height="5" rx="1.5" />
              {/* Right lower leg */}
              <rect x="16" y="17" width="3" height="5" rx="1.5" />
            </svg>
          </button>

          <div className="nc-topbar-title">
            <div className="nc-status-dot" />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '.1em' }}>
              ISABEL
            </span>
          </div>

          <div className="nc-topbar-actions">
            <button
              className={`nc-toggle-btn ${voiceMode ? 'nc-toggle-btn--on' : ''}`}
              onClick={() => setVoiceMode((v) => !v)}
              title={voiceMode ? 'ElevenLabs Auto-speak: ON' : 'ElevenLabs Auto-speak: OFF'}
            >
              {ttsLoading ? (
                <div className="nc-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
              {voiceMode ? 'Auto-speak ON' : 'Auto-speak OFF'}
            </button>
            <span style={{ fontSize: 13, color: 'rgba(232,228,255,.45)' }}>{user?.name}</span>
            <button className="nc-icon-btn" onClick={handleLogout} title="Sign out"
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(124,77,255,.25)', color: 'rgba(232,228,255,.55)' }}>
              Sign Out
            </button>
          </div>
        </header>

        {/* ── Messages ──────────────────────────────── */}
        <div className="nc-messages-container">
          {messages.length === 0 && (
            <div className="nc-welcome">
              <div className="nc-welcome-orb">
                <div className="nc-welcome-orb-inner" />
              </div>
              <h1 className="nc-welcome-title">
                Hi, I'm{' '}
                <span style={{ background: 'linear-gradient(130deg,#a67cff,#c84dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Isabel
                </span>
              </h1>
              <p className="nc-welcome-sub">
                Your AI assistant powered by Claude. Ask me anything — coding, writing, analysis, or just a conversation.
              </p>
              <div className="nc-welcome-chips">
                {['Explain quantum computing 🔬', 'Write a Python web scraper 💻', 'Help me plan my week 📅', 'Tell me something fascinating ✨'].map((s) => (
                  <button key={s} className="nc-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSpeak={handleSpeak}
              speaking={speakingId === msg.id}
              speakingId={speakingId}
            />
          ))}

          {error && (
            <div className="nc-error-banner">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input Bar ─────────────────────────────── */}
        <div className="nc-input-area">
          {listening && (
            <div className="nc-listening-indicator">
              <div className="nc-wave" /><div className="nc-wave" /><div className="nc-wave" />
              <span>Listening… say something</span>
              {input && <em>"{input}"</em>}
            </div>
          )}

          <div className="nc-input-bar">
            {sttSupported && (
              <button
                className={`nc-icon-btn nc-mic-btn ${listening ? 'nc-mic-btn--active' : ''}`}
                onClick={handleVoiceSend}
                title={listening ? 'Stop & send' : 'Voice input'}
                disabled={sending}
              >
                {listening ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
            )}

            <textarea
              ref={textareaRef}
              className="nc-input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Isabel… (Enter to send, Shift+Enter for newline)"
              rows={1}
              disabled={sending}
            />

            <button
              className={`nc-send-btn ${sending ? 'nc-send-btn--loading' : ''}`}
              onClick={handleSend}
              disabled={sending || !input.trim()}
              title="Send"
            >
              {sending ? (
                <div className="nc-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>

          <p className="nc-input-hint">
            Supports Text · Voice Input · Voice Output · Markdown rendering
          </p>
        </div>
      </main>
    </div>
  );
}
