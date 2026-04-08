import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ message, onSpeak, speaking, speakingId }) {
  const isUser = message.role === 'user';
  const isBeingSpoken = speakingId === message.id;

  return (
    <div className={`nc-msg-row ${isUser ? 'nc-msg-row--user' : 'nc-msg-row--ai'}`}>
      <div className={`nc-avatar ${isUser ? 'nc-avatar--user' : 'nc-avatar--ai'}`}>
        {isUser ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zM9 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
          </svg>
        )}
      </div>

      <div className={`nc-bubble ${isUser ? 'nc-bubble--user' : 'nc-bubble--ai'}`}>
        {message.inputMode === 'speech' && (
          <span className="nc-speech-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
            voice
          </span>
        )}

        {isUser ? (
          <p className="nc-bubble-text">{message.content}</p>
        ) : (
          <div className="nc-bubble-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {message.streaming && <span className="nc-cursor-blink">▋</span>}
          </div>
        )}

        {!isUser && !message.streaming && onSpeak && (
          <button
            className={`nc-speak-btn ${isBeingSpoken ? 'nc-speak-btn--active' : ''}`}
            onClick={() => onSpeak(message)}
            title={isBeingSpoken ? 'Stop speaking' : 'Read aloud'}
          >
            {isBeingSpoken ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
