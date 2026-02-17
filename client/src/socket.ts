import { io } from "socket.io-client";

// Connects to backend URL
const URL = "http://localhost:4000";

// Connects as soon as the app loads
export const socket = io(URL, {
  autoConnect: true 
});