import { Server } from "socket.io";
import Redis from "ioredis";

// Connect to the Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// 2. Start the Socket.io
const io = new Server(4000, {
  cors: { origin: "*" } 
});

console.log("Librarian is awake on port 4000...");

io.on("connection", (socket) => {
  console.log("A user just connected:", socket.id);

  // We will add the 'request-lock' logic here next!
  
  socket.on("disconnect", () => {
    console.log("User left the building.");
  });
});