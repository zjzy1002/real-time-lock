import { useEffect, useState } from 'react';
import { socket } from './socket';

function App() {
  //track if connected
  const [isConnected, setIsConnected] = useState(socket.connected);
  //track if session expired
  const [isExpired, setIsExpired] = useState(false);

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

      if (data.isLocked) {
        setTimeLeft(data.expiredIn);
        setIsExpired(false);
      } else {
        //Ensures the UI stays Green
        setTimeLeft(0);
        setIsExpired(false);
      }
    };

    //listner for error
    const onLockError = (data: { message: string }) => {
      alert(data.message);
    };

    // Handler for the server's successful handshake reply
    // const onHandshakeSuccess = (data: { text: string; time: string }) => {
    //   setServerReply(`${data.text} at ${data.time}`);
    // };

    // 2. Attach listeners to the socket
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lock-update', onLockUpdate);
    socket.on('lock-error', onLockError);

    // 3. Cleanup: Remove listeners if the user is away
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lock-update', onLockUpdate);
      socket.off('lock-error', onLockError);
    };
  }, []);

    //The timer ticker
    useEffect(() => {
      if (timeLeft <= 0) return;
    
      const timer = setInterval(() => {

      // When setTimeLeft(18) is called, this effect kills the old 
      // 8s timer and starts a fresh one from 18s.
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsExpired(true); // trigger the prompt
            socket.emit("release-lock", { adId: "car-123", userId: socket.id});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    

      return () => clearInterval(timer);
    }, [timeLeft]);
  
    const handleRequestLock = () => {
      // We send the ID of the ad we want to lock and our own ID
      socket.emit("request-lock", { 
        adId: "car-123", 
        userId: myUserId 
      });
    };

    const handleRenewLock = () => {
      socket.emit("renew-lock", { 
        adId: "car-123", 
        userId: socket.id 
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
        <h1>🚗 Ad Editor: 2025 Tesla Model 3</h1>
  
        {/* 1. SESSION EXPIRED PROMPT: Only shows when timer hits zero */}
        {isExpired ? (
          <div style={{ 
            marginTop: '20px', 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#fff7e6', 
            border: '2px dashed #ffa940',
            borderRadius: '12px' 
          }}>
            <h2 style={{ color: '#d46b08' }}>⌛ Session Expired</h2>
            <p>Your editing time has run out and the lock has been released.</p>
            <button 
              onClick={() => {
                console.log("Button clicked: clean up session")
                setIsExpired(false);
                socket.emit("release-lock", {adId: "car-123", userId: socket.id});
                // setLockInfo({ isLocked: false, lockedBy: null });
                // setTimeLeft(0);
                // handleRequestLock();
              }}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#1677ff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Start New Session
            </button>
          </div>
        ) : (
          /* 2. MAIN EDITOR UI: Shows when session is active or ad is available */
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
                  <strong>Editor:</strong> {lockInfo.lockedBy === socket.id ? "You (Current Session)" : `User ${lockInfo.lockedBy}`}
                </p>
                
                {/* Countdown Display with color change*/}
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
              {/* CLAIM BUTTON */}
              <button 
                onClick={handleRequestLock} 
                disabled={lockInfo.isLocked}
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '16px', 
                  cursor: lockInfo.isLocked ? 'not-allowed' : 'pointer',
                  backgroundColor: lockInfo.isLocked ? '#d9d9d9' : '#1677ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                Claim Edit Lock
              </button>
  
              {/* RENEW BUTTON*/}
              {lockInfo.isLocked && lockInfo.lockedBy === socket.id && (
                <button 
                  onClick={handleRenewLock}
                  style={{ 
                    padding: '12px 24px', 
                    backgroundColor: '#faad14',
                    color: 'black',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Add +10s
                </button>
              )}
  
              {/* SAVE & RELEASE BUTTON */}
              <button 
                onClick={handleReleaseLock} 
                disabled={!lockInfo.isLocked || lockInfo.lockedBy !== socket.id}
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '16px', 
                  cursor: (!lockInfo.isLocked || lockInfo.lockedBy !== socket.id) ? 'not-allowed' : 'pointer',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
              >
                Save & Release
              </button>
            </div>
          </div>
        )}
  
        {/* FOOTER: Session Debug Info */}
        <div style={{ marginTop: '20px', color: '#8c8c8c' }}>
          Your Session ID: <code>{socket.id}</code>
        </div>
      </div>
    );
  }
  
  export default App;