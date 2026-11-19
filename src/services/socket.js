import { io } from "socket.io-client";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_URL = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"]
});

export default socket;
