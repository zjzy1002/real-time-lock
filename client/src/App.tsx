import { useEffect, useState } from 'react';
import { socket } from './socket';

function App() {
  //track if we are connected
  const [isConnected, setIsConnected] = useState(socket.connected);

  //track lock details
  const [lockInfo, setLockInfo] = useState<{ isLocked: boolean; lockedBy: string | null}>({
    isLocked: false,
    lockedBy: null,
  })

  const myUserId = socket.id;

  //store the message from the server
  const [serverReply, setServerReply] = useState("");

  useEffect(() => {
    // 1. Handlers for connection status
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    //listner for lock updates
    const onLockUpdate = (data: {adId: string; lockBy: string | null; isLocked: boolean}) => {
      setLockInfo({isLocked: data.isLocked, lockedBy: data.lockBy});
    }

    //listner for error
    const onLockError = (data: { message: string }) => {
      alert(data.message);
    };

    // 2. Handler for the server's successful handshake reply
    const onHandshakeSuccess = (data: { text: string; time: string }) => {
      setServerReply(`${data.text} at ${data.time}`);
    };

    // 3. Attach listeners to the socket
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lock-update', onLockUpdate);
    socket.on('lock-error', onLockError);

    // 4. Cleanup: Remove listeners if the user is away
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lock-update', onLockUpdate);
      socket.off('lock-error', onLockError);
    };
  }, []);

  // Function to manually trigger a handshake test
  const triggerHandshake = () => {
    socket.emit("test-handshake", { message: "Hi Server, can you hear me?" });
  };

  const handleRequestLock = () => {
    socket.emit("request-lock", { adId: "car-123", userId: myUserId });
  };

  const handleReleaseLock = () => {
    socket.emit("release-lock", { adId: "car-123", userId: myUserId });
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>Ad Editor: Car #123</h1>
      
      <div style={{ margin: '20px 0', fontSize: '20px' }}>
        Status: <strong>{isConnected ? "Connected" : "Disconnected"}</strong>
      </div>

      <div style={{
        padding: '20px', 
        border: '2px solid', 
        borderColor: lockInfo.isLocked ? '#ff4d4f' : '#52c41a',
        borderRadius: '8px',
        backgroundColor: lockInfo.isLocked ? '#fff1f0' : '#f6ffed'
      }}>
        {lockInfo.isLocked ? (
          <p> <strong>Locked by:</strong> {lockInfo.lockedBy === myUserId ? "YOU (Editing...)" : lockInfo.lockedBy}</p>
        ) : (
          <p> <strong>Status:</strong> Ready for editing</p>
        )}

<div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleRequestLock} 
            disabled={lockInfo.isLocked} // Disable if anyone (including you) has the lock
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Edit Ad (Lock)
          </button>

          <button 
            onClick={handleReleaseLock} 
            disabled={!lockInfo.isLocked || lockInfo.lockedBy !== myUserId} 
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Save & Release
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;