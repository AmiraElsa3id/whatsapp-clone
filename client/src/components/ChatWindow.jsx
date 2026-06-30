import { useState, useEffect, useRef } from 'react';

export default function ChatWindow({ activeChat, messages, currentUser, onSendPrivate, onSendGroup }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="chat-placeholder">
        <div>
          <span className="placeholder-icon">💬</span>
          <p>Select a person or group to start chatting</p>
        </div>
      </div>
    );
  }

  function handleSend(e) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    if (activeChat.type === 'private') {
      onSendPrivate(activeChat.id, msg);
    } else {
      onSendGroup(activeChat.id, msg);
    }
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e);
  }

  const chatTitle = activeChat.type === 'group' ? `# ${activeChat.name}` : activeChat.name;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <span className={`avatar-small ${activeChat.type === 'group' ? 'group' : 'online'}`}>
          {activeChat.type === 'group' ? '#' : activeChat.name[0].toUpperCase()}
        </span>
        <span className="chat-title">{chatTitle}</span>
        <span className="chat-type-badge">{activeChat.type === 'group' ? 'Group' : 'Private'}</span>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="no-messages">No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.fromId === currentUser.id;
          return (
            <div key={i} className={`message ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && activeChat.type === 'group' && (
                <span className="msg-sender">{msg.from}</span>
              )}
              <div className="bubble">{msg.text}</div>
              <span className="msg-time">
                {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="message-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button type="submit" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}
