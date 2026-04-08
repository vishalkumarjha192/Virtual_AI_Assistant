const BASE = '/api/chat';

// ── Streaming chat (Cohere SSE) ───────────────────────────────────────────
export async function* streamMessage({ sessionId, content, inputMode }) {
  const res = await fetch(`${BASE}/message`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, content, inputMode }),
  });

  if (!res.ok) throw new Error(`Server error: ${res.statusText}`);

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch {
          // ignore
        }
      }
    }
  }
}

// ── ElevenLabs TTS — returns a playable blob URL ─────────────────────────
export async function fetchTTS(text) {
  const res = await fetch(`${BASE}/tts`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error('TTS request failed');

  const blob = await res.blob();
  return URL.createObjectURL(blob);   // returns a blob:// URL for <audio>
}

// ── History / sessions ───────────────────────────────────────────────────
export async function fetchHistory(sessionId) {
  const res = await fetch(`${BASE}/history/${sessionId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${BASE}/sessions`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE}/session/${sessionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete session');
  return res.json();
}
