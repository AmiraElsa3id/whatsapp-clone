import { useState } from 'react';

export default function Sidebar({ currentUser, onlineUsers, groups, activeChat, onSelectUser, onSelectGroup, onNewGroup }) {
  const [tab, setTab] = useState('people');

  const others = onlineUsers.filter((u) => u.id !== currentUser.id);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="current-user">
          <span className="avatar">{currentUser.username[0].toUpperCase()}</span>
          <span className="username">{currentUser.username}</span>
        </div>
        <button className="btn-new-group" onClick={onNewGroup} title="New Group">+</button>
      </div>

      <div className="tabs">
        <button className={tab === 'people' ? 'tab active' : 'tab'} onClick={() => setTab('people')}>
          People {others.length > 0 && <span className="badge">{others.length}</span>}
        </button>
        <button className={tab === 'groups' ? 'tab active' : 'tab'} onClick={() => setTab('groups')}>
          Groups {groups.length > 0 && <span className="badge">{groups.length}</span>}
        </button>
      </div>

      <ul className="chat-list">
        {tab === 'people' && others.length === 0 && (
          <li className="empty-hint">No other users online yet.<br />Open another tab to test!</li>
        )}
        {tab === 'people' && others.map((u) => (
          <li
            key={u.id}
            className={activeChat?.type === 'private' && activeChat.id === u.id ? 'chat-item active' : 'chat-item'}
            onClick={() => onSelectUser(u)}
          >
            <span className="avatar-small online">{u.username[0].toUpperCase()}</span>
            <span>{u.username}</span>
          </li>
        ))}

        {tab === 'groups' && groups.length === 0 && (
          <li className="empty-hint">No groups yet.<br />Click + to create one!</li>
        )}
        {tab === 'groups' && groups.map((g) => (
          <li
            key={g.id}
            className={activeChat?.type === 'group' && activeChat.id === g.id ? 'chat-item active' : 'chat-item'}
            onClick={() => onSelectGroup(g)}
          >
            <span className="avatar-small group">#</span>
            <span>{g.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
