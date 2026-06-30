const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ─── In-memory state ─────────────────────────────────────────────────────────
// Upgrade path: replace Maps with MongoDB collections
const users   = new Map(); // socketId → { id, username }
const groups  = new Map(); // groupId  → { id, name, memberIds: Set<socketId> }
const history = new Map(); // roomKey  → [{ from, text, at }]

function roomKey(id1, id2) {
  return `private:${[id1, id2].sort().join(':')}`;
}

function broadcastUsers() {
  const list = [...users.values()].map(({ id, username }) => ({ id, username }));
  io.emit('users:update', list);
}

function broadcastGroups() {
  const list = [...groups.values()].map(({ id, name }) => ({ id, name }));
  io.emit('groups:update', list);
}

// ─── Socket events ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // 1. User joins with a username
  socket.on('user:join', ({ username }, ack) => {
    const user = { id: socket.id, username };
    users.set(socket.id, user);
    broadcastUsers();
    broadcastGroups(); // send existing groups to new user

    // Re-join any groups this user was part of (by socket id — resets on refresh)
    // Upgrade path: persist group membership in DB and re-join here
    if (typeof ack === 'function') ack(user);
  });

  // 2. Private message
  socket.on('msg:private', ({ toId, text }) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    const key = roomKey(socket.id, toId);
    const msg = { from: sender.username, fromId: socket.id, text, at: Date.now() };

    if (!history.has(key)) history.set(key, []);
    history.get(key).push(msg);

    // Send to recipient and back to sender
    socket.to(toId).emit('msg:private', { roomKey: key, ...msg });
    socket.emit('msg:private', { roomKey: key, ...msg });
  });

  // 3. Create a group
  socket.on('group:create', ({ name, memberIds }) => {
    const creator = users.get(socket.id);
    if (!creator) return;

    const id = uuidv4();
    const allMembers = new Set([socket.id, ...memberIds]);
    groups.set(id, { id, name, memberIds: allMembers });

    // Join all online members to the socket.io room
    allMembers.forEach((sid) => {
      const s = io.sockets.sockets.get(sid);
      if (s) s.join(id);
    });

    broadcastGroups();
  });

  // 4. Join an existing group (e.g. after page refresh)
  socket.on('group:join', ({ groupId }, ack) => {
    const group = groups.get(groupId);
    if (!group) return;

    group.memberIds.add(socket.id);
    socket.join(groupId);

    // Send history to the joiner
    const msgs = history.get(`group:${groupId}`) || [];
    if (typeof ack === 'function') ack(msgs);
  });

  // 5. Group message
  socket.on('msg:group', ({ groupId, text }) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    const key = `group:${groupId}`;
    const msg = { from: sender.username, fromId: socket.id, text, at: Date.now() };

    if (!history.has(key)) history.set(key, []);
    history.get(key).push(msg);

    io.to(groupId).emit('msg:group', { groupId, roomKey: key, ...msg });
  });

  // 6. Request chat history for a room
  socket.on('history:get', ({ roomKey: key }, ack) => {
    if (typeof ack === 'function') ack(history.get(key) || []);
  });

  // 7. Disconnect
  socket.on('disconnect', () => {
    users.delete(socket.id);
    broadcastUsers();
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
