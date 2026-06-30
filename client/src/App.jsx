import { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import GroupModal from './components/GroupModal';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers]  = useState([]);
  const [groups, setGroups]            = useState([]);
  const [activeChat, setActiveChat]    = useState(null);
  const [messages, setMessages]        = useState({}); // roomKey → []
  const [showModal, setShowModal]      = useState(false);

  // ─── Connect & register socket listeners once ───────────────────────────────
  useEffect(() => {
    socket.on('users:update', setOnlineUsers);
    socket.on('groups:update', setGroups);

    socket.on('msg:private', (msg) => {
      setMessages((prev) => {
        const key = msg.roomKey;
        return { ...prev, [key]: [...(prev[key] || []), msg] };
      });
    });

    socket.on('msg:group', (msg) => {
      setMessages((prev) => {
        const key = msg.roomKey;
        return { ...prev, [key]: [...(prev[key] || []), msg] };
      });
    });

    return () => {
      socket.off('users:update');
      socket.off('groups:update');
      socket.off('msg:private');
      socket.off('msg:group');
    };
  }, []);

  // ─── Join ───────────────────────────────────────────────────────────────────
  function handleJoin(username) {
    socket.connect();
    socket.emit('user:join', { username }, (user) => {
      setCurrentUser(user);
    });
  }

  // ─── Select private chat ────────────────────────────────────────────────────
  const handleSelectUser = useCallback((user) => {
    const key = `private:${[socket.id, user.id].sort().join(':')}`;
    setActiveChat({ type: 'private', id: user.id, name: user.username, roomKey: key });

    // Fetch history from server if not already loaded
    setMessages((prev) => {
      if (prev[key]) return prev;
      socket.emit('history:get', { roomKey: key }, (msgs) => {
        setMessages((p) => ({ ...p, [key]: msgs }));
      });
      return prev;
    });
  }, []);

  // ─── Select group chat ──────────────────────────────────────────────────────
  const handleSelectGroup = useCallback((group) => {
    const key = `group:${group.id}`;
    setActiveChat({ type: 'group', id: group.id, name: group.name, roomKey: key });

    socket.emit('group:join', { groupId: group.id }, (msgs) => {
      setMessages((prev) => ({ ...prev, [key]: msgs }));
    });
  }, []);

  // ─── Send private message ───────────────────────────────────────────────────
  function handleSendPrivate(toId, text) {
    socket.emit('msg:private', { toId, text });
  }

  // ─── Send group message ─────────────────────────────────────────────────────
  function handleSendGroup(groupId, text) {
    socket.emit('msg:group', { groupId, text });
  }

  // ─── Create group ───────────────────────────────────────────────────────────
  function handleCreateGroup(name, memberIds) {
    socket.emit('group:create', { name, memberIds });
  }

  // ─── Active messages ────────────────────────────────────────────────────────
  const activeMsgs = activeChat ? (messages[activeChat.roomKey] || []) : [];

  if (!currentUser) {
    return <Login onJoin={handleJoin} />;
  }

  return (
    <div className="app">
      <Sidebar
        currentUser={currentUser}
        onlineUsers={onlineUsers}
        groups={groups}
        activeChat={activeChat}
        onSelectUser={handleSelectUser}
        onSelectGroup={handleSelectGroup}
        onNewGroup={() => setShowModal(true)}
      />
      <ChatWindow
        activeChat={activeChat}
        messages={activeMsgs}
        currentUser={currentUser}
        onSendPrivate={handleSendPrivate}
        onSendGroup={handleSendGroup}
      />
      {showModal && (
        <GroupModal
          onlineUsers={onlineUsers}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
}
