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
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    // 1. Handlers for connection status
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    //listner for lock updates
    const onLockUpdate = (data: any) => {
      console.log("Received data from server:", data);
      setLockInfo({ isLocked: data.isLocked, lockedBy: data.lockedBy });
      if (data.isLocked && data.expiredIn) {
        setTimeLeft(data.expiredIn);
      } else {
        setTimeLeft(0);
      }
    };

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

    //The timer ticker
    useEffect(() => {
      //If timeLeft hits 0, stop everything
      if (timeLeft <= 0) {
        console.log("Timer reached 0 or is inactive.");
        return;
      }
    
      console.log("Timer started/resumed at:", timeLeft);
    
      //Set up the interval
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    
      //If the user clicks "Release" or if the component re-renders
      return () => {
        console.log("Cleaning up timer...");
        clearInterval(timer);
      };
    }, [timeLeft]); // <--- This ensures the effect sees the NEW time every second
  
    const handleRequestLock = () => {
      // We send the ID of the ad we want to lock and our own ID
      socket.emit("request-lock", { 
        adId: "car-123", 
        userId: myUserId 
      });
    };
  
    const handleReleaseLock = () => {
      // We tell the server to remove the lock for this ad
      socket.emit("release-lock", { 
        adId: "car-123", 
        userId: myUserId 
      });
    };
  
    // --- UI ---
    return (
      <div style={{ padding: '50px', fontFamily: 'system-ui, sans-serif' }}>
        <h1>🚗 Ad Editor: 2024 Tesla Model 3</h1>
        
        <div style={{ 
          marginTop: '20px',
          padding: '30px', 
          borderRadius: '12px',
          border: '2px solid',
          borderColor: lockInfo.isLocked ? '#ff4d4f' : '#52c41a',
          backgroundColor: lockInfo.isLocked ? '#fff1f0' : '#f6ffed',
          transition: 'all 0.3s ease'
        }}>
          
          {lockInfo.isLocked ? (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#cf1322', margin: '0 0 10px 0' }}>⚠️ Ad is Locked</h2>
              <p>
                <strong>Editor:</strong> {lockInfo.lockedBy === myUserId ? "You (Current Session)" : `User ${lockInfo.lockedBy}`}
              </p>
              
              {/* The Countdown Display */}
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: timeLeft < 4 ? '#f5222d' : '#faad14' 
              }}>
                ⏱️ Time remaining: {timeLeft}s
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: '#389e0d', margin: '0 0 10px 0' }}>✅ Ad is Available</h2>
              <p>Nobody is currently editing this advertisement.</p>
            </div>
          )}
  
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={handleRequestLock} 
              disabled={lockInfo.isLocked}
              style={{ 
                padding: '12px 24px', 
                fontSize: '16px', 
                cursor: lockInfo.isLocked ? 'not-allowed' : 'pointer',
                backgroundColor: '#1677ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              Claim Edit Lock
            </button>
  
            <button 
              onClick={handleReleaseLock} 
              disabled={!lockInfo.isLocked || lockInfo.lockedBy !== myUserId}
              style={{ 
                padding: '12px 24px', 
                fontSize: '16px', 
                cursor: (!lockInfo.isLocked || lockInfo.lockedBy !== myUserId) ? 'not-allowed' : 'pointer',
                backgroundColor: '#ffffff',
                border: '1px solid #d9d9d9',
                borderRadius: '6px'
              }}
            >
              Save & Release
            </button>
          </div>
        </div>
  
        <div style={{ marginTop: '20px', color: '#8c8c8c' }}>
          Your Session ID: <code>{myUserId}</code>
        </div>
      </div>
    );
  }
  
  export default App;