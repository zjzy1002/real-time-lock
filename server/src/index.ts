import express = require('express');
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';

const app = express();
const httpServer = createServer(app);


// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

//initialize Redis Connection
const redis = new Redis({
  host: 'localhost',
  port: 6379
});

const LOCK_TTL = 10;



io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);



  socket.on("request-lock", async ({ adId, userId }) => {
    const lockKey = `lock:ad:${adId}`;
    
    // SET with NX (Not Exists) and EX (Expires set in 60 seconds. For showcase, set 10000ms = 10 seconds)
    // This is "Atomic": only one user can successfully SET this at a time.
    const result = await redis.set(lockKey, userId, "EX", LOCK_TTL, "NX");

    if (result === "OK") {
      // SUCCESS: Tell EVERYONE the ad is now locked
      io.emit("lock-update", { adId, lockedBy: userId, isLocked: true, expiredIn: LOCK_TTL });
      console.log(`${userId} locked ${adId}`);
    } else {
      // FAIL: Tell ONLY the person who tried that it's taken
      socket.emit("lock-error", { message: "Access Denied: Someone is already editing." });
    }
  });


  socket.on("renew-lock", async ({ adId, userId }) => {
    const lockKey = `lock:ad:${adId}`;
    
    //Get current owner AND current TTL
    const [currentOwner, currentTTL] = await Promise.all([
      redis.get(lockKey),
      redis.ttl(lockKey)
    ]);
  
    //Check: Do you still own this lock?
    if (currentOwner === userId) {
      // If TTL is -2 (expired) or -1 (no expiry), default to 0
      const baseTime = currentTTL > 0 ? currentTTL : 0;
      const newTTL = baseTime + LOCK_TTL;
  
      //Update Redis
      await redis.expire(lockKey, newTTL);
      
      //Broadcast the new STACKED time
      io.emit("lock-update", { 
        adId, 
        lockedBy: userId, 
        isLocked: true, 
        expiredIn: newTTL 
      });
      console.log(`🔄 ${userId} extended lock. New total: ${newTTL}s`);
    } else {
      // If the lock expired before they clicked, give them a NEW lock
      // OR just tell the client the lock is gone.
      io.emit("lock-update", { adId, lockedBy: null, isLocked: false });
    }
  });


  socket.on("release-lock", async ({ adId, userId }) => {
    const lockKey = `lock:ad:${adId}`;
    
    //Force delete from Redis (don't check owner, just kill it)
    await redis.del(lockKey);
    
    //Tell EVERYONE the lock is dead
    io.emit("lock-update", { 
      adId, 
      lockedBy: null, 
      isLocked: false, 
      expiresIn: 0 
    });
  })

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(4000, () => {
  console.log("Socket server running on http://localhost:4000");
});