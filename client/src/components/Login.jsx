import { useState } from 'react';

export default function Login({ onJoin }) {
  const [username, setUsername] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const name = username.trim();
    if (name) onJoin(name);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">💬</div>
        <h1>WhatsApp Clone</h1>
        <p>Enter your name to start chatting</p>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            placeholder="Your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
          />
          <button type="submit" disabled={!username.trim()}>
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
