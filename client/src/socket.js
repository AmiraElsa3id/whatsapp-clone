import { io } from 'socket.io-client';

// Upgrade path: replace URL with env var (import.meta.env.VITE_SERVER_URL)
export const socket = io('http://localhost:4000', { autoConnect: false });
