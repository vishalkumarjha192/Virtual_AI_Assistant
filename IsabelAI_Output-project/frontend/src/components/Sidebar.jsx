import { useEffect, useState } from 'react';
import { fetchSessions, deleteSession } from '../chatApi.js';

export default function Sidebar({ currentSessionId, onSelect, onNew, onDelete }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    await deleteSession(sessionId);
    setSessions((s) => s.filter((x) => x.sessionId !== sessionId));
    if (currentSessionId === sessionId) onDelete();
  };

  return (
    <aside className="nc-sidebar">
      <div className="nc-sidebar-header">
        <div className="nc-sidebar-logo">
          <div className="nc-logo-orb" />
          <span>Isabel AI</span>
        </div>
        <button className="nc-new-chat-btn" onClick={onNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="nc-sidebar-label">Conversations</div>

      <div className="nc-sessions-list">
        {loading && (
          <div className="nc-sessions-empty">
            <div className="nc-spinner-sm" />
          </div>
        )}
        {!loading && sessions.length === 0 && (
          <div className="nc-sessions-empty">No conversations yet</div>
        )}
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className={`nc-session-item ${s.sessionId === currentSessionId ? 'nc-session-item--active' : ''}`}
            onClick={() => onSelect(s.sessionId)}
          >
            <div className="nc-session-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="nc-session-info">
              <div className="nc-session-title">{s.title || 'New Conversation'}</div>
              <div className="nc-session-date">
                {new Date(s.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <button
              className="nc-session-delete"
              onClick={(e) => handleDelete(e, s.sessionId)}
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="nc-sidebar-footer">
        <div className="nc-model-badge">
          <div className="nc-model-dot" />
          IsabelAI-3.O
        </div>
      </div>
    </aside>
  );
}
