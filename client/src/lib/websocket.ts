interface WebSocketCallbacks {
  onMemberUpdated: (member: any) => void;
  onLocationUpdated: (member: any) => void;
  onNewMessage: (message: any) => void;
  onNewPing: (ping: any) => void;
  onMemberLeft: (memberId: number) => void;
}

export function initializeWebSocket(memberId: number, callbacks: WebSocketCallbacks) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connected');
    // Join the group
    socket.send(JSON.stringify({
      type: 'join',
      memberId: memberId,
    }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'member_updated':
          callbacks.onMemberUpdated(data.member);
          break;
        case 'location_updated':
          callbacks.onLocationUpdated(data.member);
          break;
        case 'new_message':
          callbacks.onNewMessage(data.message);
          break;
        case 'new_ping':
          callbacks.onNewPing(data.ping);
          break;
        case 'member_left':
          callbacks.onMemberLeft(data.memberId);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      initializeWebSocket(memberId, callbacks);
    }, 5000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return socket;
}
