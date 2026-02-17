import express = require('express');
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`📡 User connected: ${socket.id}`);

  // Listen for the test signal
  socket.on("test-message", (data) => {
    console.log(`Received from client: ${data.text}`);
    
    // Send it back to EVERYONE (including the sender)
    io.emit("broadcast-test", {
      message: `Server received: ${data.text}`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected");
  });
});

httpServer.listen(4000, () => {
  console.log("Socket server running on http://localhost:4000");
});