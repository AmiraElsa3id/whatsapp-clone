# How the WhatsApp Clone Works

## The Big Picture

```
Browser Tab 1          Server              Browser Tab 2
(Alice)          ←→  Express +  ←→       (Bob)
                     Socket.io
```

HTTP is one-way (client asks, server answers). **WebSockets** flip that — the server can push messages to the client at any time. Socket.io is a library that wraps WebSockets and adds rooms, reconnection, and acknowledgements on top.

---

## How Socket.io Works

### 1. The Handshake

When Alice opens the app, this happens:

```
Alice's browser  ──HTTP GET /socket.io/──→  Server
                 ←── "upgrade to WebSocket" ──
                 ←══ persistent connection ══→
```

After that, both sides can send messages to each other **anytime**, without a new request. The connection stays open.

### 2. Events — the language they speak

Socket.io uses named events (like custom signals). You **emit** (send) and **listen** (receive).

```js
// Client sends
socket.emit('msg:private', { toId: 'xyz', text: 'Hello!' });

// Server listens
socket.on('msg:private', ({ toId, text }) => { ... });
```

It's like a walkie-talkie — you push a button (emit), the other side hears it (on).

### 3. Every user is a socket

When Alice connects, Socket.io gives her a unique ID: `socket.id = "abc123"`. When Bob connects, he gets `"def456"`. The server keeps a Map of who's who:

```js
users = Map {
  "abc123" → { id: "abc123", username: "Alice" },
  "def456" → { id: "def456", username: "Bob" }
}
```

---

## Private Chat Flow (step by step)

```
Alice (abc123)                  Server                  Bob (def456)
     │                            │                           │
     │── user:join {Alice} ──────→│  users.set("abc123",      │
     │                            │    { username: "Alice" }) │
     │                            │── users:update ──────────→│
     │                            │── users:update ──────────→│ (all tabs)
     │                            │                           │
     │── msg:private ────────────→│                           │
     │   { toId:"def456",         │  builds msg object        │
     │     text:"Hello!" }        │  saves to history         │
     │                            │── msg:private ───────────→│ (to Bob only)
     │←── msg:private ────────────│ (echoed back to Alice)    │
```

The key code in `server/index.js`:

```js
socket.on('msg:private', ({ toId, text }) => {
  const msg = { from: sender.username, text, at: Date.now() };
  socket.to(toId).emit('msg:private', msg);  // → Bob only
  socket.emit('msg:private', msg);            // → Alice (echo)
});
```

`socket.to(toId)` means "send to that specific socket ID only" — no one else sees it.

**Room key** — how the app knows which chat thread to show:

```js
roomKey = `private:${["abc123", "def456"].sort().join(":")}`
       // = "private:abc123:def456"  (always the same regardless of who sends first)
```

---

## Group Chat Flow

Groups use Socket.io **rooms** — a named channel that multiple sockets can join.

```
Alice (abc123)               Server                  Bob, Carol
     │                          │                         │
     │── group:create ─────────→│  groups.set(groupId,    │
     │   { name:"ITI Team",     │    { name, members })   │
     │     memberIds:["def456"] │                         │
     │                          │  socket.join(groupId)   │ ← all members join
     │                          │── groups:update ────────→│
     │                          │                         │
     │── msg:group ────────────→│                         │
     │   { groupId, text }      │  io.to(groupId).emit()  │
     │                          │── msg:group ────────────→│ (ALL room members)
```

The key difference:

- **Private:** `socket.to(specificSocketId)` — one person
- **Group:** `io.to(groupId)` — everyone in the room

---

## The Client Side

### Singleton socket (`socket.js`)

```js
export const socket = io('http://localhost:4000', { autoConnect: false });
```

`autoConnect: false` means it doesn't connect until Alice hits Join. Then in `App.jsx`:

```js
socket.connect();                          // open the WebSocket
socket.emit('user:join', { username });    // register with server
```

### Listening for messages (`App.jsx`)

```js
socket.on('msg:private', (msg) => {
  setMessages(prev => ({
    ...prev,
    [msg.roomKey]: [...(prev[msg.roomKey] || []), msg]   // append to that thread
  }));
});
```

`messages` is an object keyed by room key:

```js
{
  "private:abc123:def456": [{ from:"Alice", text:"Hello!" }, ...],
  "group:uuid-xxx":        [{ from:"Bob", text:"Hey team!" }, ...]
}
```

The active chat window reads `messages[activeChat.roomKey]`.

---

## Socket Events Reference

### Client → Server

| Event | Payload | What it does |
|---|---|---|
| `user:join` | `{ username }` | Register user, broadcast updated user list |
| `msg:private` | `{ toId, text }` | Send message to one person |
| `group:create` | `{ name, memberIds }` | Create a group room, join all members |
| `group:join` | `{ groupId }` | Join a group (e.g. after page refresh) |
| `msg:group` | `{ groupId, text }` | Broadcast to all group members |
| `history:get` | `{ roomKey }` | Fetch past messages for a chat thread |

### Server → Client

| Event | Payload | Who receives |
|---|---|---|
| `users:update` | `[{ id, username }]` | Everyone (on join/leave) |
| `groups:update` | `[{ id, name }]` | Everyone |
| `msg:private` | `{ from, text, at, roomKey }` | Sender + recipient only |
| `msg:group` | `{ from, text, at, groupId, roomKey }` | All group members |

---

## What Each File Does

| File | Role |
|---|---|
| `server/index.js` | The brain — tracks users/groups, routes messages, manages rooms |
| `client/src/socket.js` | One shared connection to the server (singleton) |
| `App.jsx` | Holds all state, wires socket events to React state |
| `Login.jsx` | Emits `user:join`, gets back `{ id, username }` |
| `Sidebar.jsx` | Renders online users + groups, click to open a chat |
| `ChatWindow.jsx` | Reads `messages[roomKey]`, emits `msg:private` or `msg:group` |
| `GroupModal.jsx` | Emits `group:create` with a name + list of member IDs |

---

## How to Run

```bash
# Terminal 1 — backend
cd server && node index.js
# Runs on http://localhost:4000

# Terminal 2 — frontend
cd client && npm run dev
# Runs on http://localhost:5173
```

---

## How to Test

### Private chat (2 friends)
1. Open **two browser tabs** at `http://localhost:5173`
2. Tab 1 → enter `Alice`, Tab 2 → enter `Bob`
3. Alice clicks Bob in the sidebar → types a message → Send
4. Message appears in Bob's tab instantly

### Group chat
1. Alice clicks `+` → names the group, checks Bob → Create
2. Open a 3rd tab as `Carol`, click the group in the Groups tab
3. Any member sends a message → all 3 tabs receive it

### Edge cases to verify
- Close a tab → that user disappears from the sidebar immediately
- Messages stay separate between rooms (each has a unique room key)
- Refresh a tab → rejoin by entering your username again

---

## The Core Idea in One Sentence

Instead of Alice asking "any new messages?" every second, **the server tells her the moment one arrives** — that's the fundamental difference between WebSockets and regular HTTP polling.
