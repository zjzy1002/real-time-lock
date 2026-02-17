import { useEffect, useState } from 'react';
import { socket } from './socket';

function App() {
  //track if we are connected
  const [isConnected, setIsConnected] = useState(socket.connected);
  //store the message from the server
  const [serverReply, setServerReply] = useState("");

  useEffect(() => {
    // 1. Handlers for connection status
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // 2. Handler for the server's successful handshake reply
    const onHandshakeSuccess = (data: { text: string; time: string }) => {
      setServerReply(`${data.text} at ${data.time}`);
    };

    // 3. Attach listeners to the socket
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('handshake-success', onHandshakeSuccess);

    // 4. Cleanup: Remove listeners if the user is away
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('handshake-success', onHandshakeSuccess);
    };
  }, []);

  // Function to manually trigger a handshake test
  const triggerHandshake = () => {
    socket.emit("test-handshake", { message: "Hi Server, can you hear me?" });
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>Socket Handshake Test</h1>
      
      <div style={{ margin: '20px 0', fontSize: '20px' }}>
        Status: <strong>{isConnected ? "Connected" : "Disconnected"}</strong>
      </div>

      <button 
        onClick={triggerHandshake} 
        style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '16px' }}
      >
        Send Handshake Signal
      </button>

      {serverReply && (
        <div style={{ marginTop: '30px', color: 'blue', fontWeight: 'bold' }}>
          Server Response: {serverReply}
        </div>
      )}
    </div>
  );
}

export default App;