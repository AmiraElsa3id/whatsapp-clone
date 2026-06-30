# WhatsApp Clone

A real-time chat application built with **React**, **Node.js**, **Express**, and **Socket.IO** — supporting private messaging and group chats.

---

## Features

- Enter any username to join instantly (no sign-up required)
- See who's online in real time
- Private one-on-one chat
- Create group chats with multiple users
- Chat history is preserved during a session
- Users disappear from the sidebar the moment they disconnect

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Backend | Node.js, Express |
| Real-time | Socket.IO (WebSockets) |
| State | React `useState` / `useEffect` |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher

### 1. Clone the repo

```bash
git clone https://github.com/AmiraElsa3id/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Start the backend

```bash
cd server
npm install
node index.js
```

Server runs on `http://localhost:4000`

### 3. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## How to Use

### Private chat
1. Open two browser tabs at `http://localhost:5173`
2. Enter a different username in each tab (e.g. `Alice` and `Bob`)
3. Click a user's name in the sidebar to open a chat
4. Type a message and press Enter or click Send

### Group chat
1. Click the `+` button in the sidebar
2. Give the group a name and select members
3. Click Create — all members will see the group appear
4. Click the group name to open the group chat

---

## Project Structure

```
whatsapp-clone/
├── server/
│   ├── index.js        # Express + Socket.IO server
│   └── package.json
└── client/
    ├── src/
    │   ├── socket.js           # Shared Socket.IO connection
    │   ├── App.jsx             # Root component, all state & socket events
    │   └── components/
    │       ├── Login.jsx       # Username entry screen
    │       ├── Sidebar.jsx     # Online users & group list
    │       ├── ChatWindow.jsx  # Message thread & send input
    │       └── GroupModal.jsx  # Create group dialog
    └── package.json
```

---

## How It Works

The app uses **WebSockets** via Socket.IO so the server can push messages to clients instantly — no polling needed.

- Each user gets a unique socket ID when they connect
- Private messages are sent directly to a specific socket ID
- Group messages use Socket.IO **rooms** — all room members receive the message at once
- Chat history is stored in memory on the server for the duration of the session

For a deeper technical explanation, see [EXPLANATION.md](./EXPLANATION.md).

---

## Notes

- Data is stored **in memory** — everything resets when the server restarts
- Users must re-enter their username after a page refresh
- No authentication or persistent storage (by design — see EXPLANATION.md for upgrade paths)
