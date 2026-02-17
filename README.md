# Real-time Ad Locking System

## Overview

This full-stack project recreate a real-world issue commonly seen in collaborative review work environment. This real-time ad lock application is built to prevent "Last-Write-Wins" collisions, when multiple reviewers editing the same record caused accidental overwrites, where the last user to save unintentionally wiped out another reviewer’s work. 

This system ensures that only one user can edit a specific ad at a time using real-time WebSockets and Redis locks

## The Architecture
- **Frontend/client:** React + TypeScript + Socket.io-client
- **Backend/server:** Node.js + TypeScript + Socket.io
- **Database:** Redis (for high-speed, expiring locks)
- **Infrastructure:** Docker & Docker Compose

## How it Works
1. **Lock Request:** When a user opens an ad, the client requests a lock via WebSockets.
2. **Redis Storage:** The server checks Redis. If the key doesn't exist, it sets it with a 10-second **TTL (Time-To-Live)**.
3. **Heartbeat:** Every 5 seconds, the client sends a "ping" to the server to renew the lock.
4. **Auto-Release:** If a user closes their tab or loses internet, the heartbeat stops. After 10 seconds, Redis automatically deletes the lock so others can edit.

## How to Run
### 1. Start the docker
Open your termimal in teh root folder
Make sure you have Docker installed, then run:
```bash
docker-compose up --build
```
Look for message: " Librarian is awake on port 4000". If you see the message, the bridge is open.

### 2. Start the backend
Open a SECOND termial window/tab and go to the server folder
```bash
cd server
npm install
npm run dev
```

### 3. Start the frontend
Open a SECOND termial window/tab and go to the client folder
```bash
cd client
npm install
npm start
```

### 4. Stop the app
Press Ctrl + C to stop the service
or 
Run ```bash docker-compose down ``` to fully clean up