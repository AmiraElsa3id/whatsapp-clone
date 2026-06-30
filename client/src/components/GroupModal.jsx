import { useState } from 'react';

export default function GroupModal({ onlineUsers, currentUser, onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCreate(e) {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    onCreateGroup(name, [...selected]);
    onClose();
  }

  const others = onlineUsers.filter((u) => u.id !== currentUser.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>New Group</h2>
        <form onSubmit={handleCreate}>
          <input
            autoFocus
            type="text"
            placeholder="Group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={40}
          />
          <p className="modal-label">Add members:</p>
          <ul className="member-list">
            {others.length === 0 && (
              <li className="no-users">No other users online</li>
            )}
            {others.map((u) => (
              <li key={u.id} onClick={() => toggle(u.id)} className={selected.has(u.id) ? 'selected' : ''}>
                <span className="avatar-small">{u.username[0].toUpperCase()}</span>
                {u.username}
                {selected.has(u.id) && <span className="check">✓</span>}
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" disabled={!groupName.trim()} className="btn-create">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
