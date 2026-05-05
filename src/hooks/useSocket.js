import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }
  return socketInstance;
}

/**
 * Hook to manage Socket.io connection and room subscription.
 * Returns { emit, connected } — connected reflects live socket state.
 */
export function useSocket(roomId, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setConnected(true);
      socket.emit('join:room', { roomId });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onReconnect = () => {
      setConnected(true);
      socket.emit('join:room', { roomId });
    };

    const onExpenseAdded = (data) => {
      handlersRef.current.onExpenseAdded?.(data);
    };

    const onExpenseUpdated = (data) => {
      handlersRef.current.onExpenseUpdated?.(data);
    };

    const onSplitPaid = (data) => {
      handlersRef.current.onSplitPaid?.(data);
    };

    const onBalanceUpdated = (data) => {
      handlersRef.current.onBalanceUpdated?.(data);
    };

    const onExpenseDeleted = (data) => {
      handlersRef.current.onExpenseDeleted?.(data);
    };

    const onMemberRemoved = (data) => {
      handlersRef.current.onMemberRemoved?.(data);
    };

    socket.on('connect',          onConnect);
    socket.on('disconnect',       onDisconnect);
    socket.on('reconnect',        onReconnect);
    socket.on('expense:added',    onExpenseAdded);
    socket.on('expense:updated',  onExpenseUpdated);
    socket.on('split:paid',       onSplitPaid);
    socket.on('balance:updated',  onBalanceUpdated);
    socket.on('expense:deleted',  onExpenseDeleted);
    socket.on('member:removed',   onMemberRemoved);

    // If already connected, join room immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit('join:room', { roomId });
    }

    return () => {
      socket.off('connect',         onConnect);
      socket.off('disconnect',      onDisconnect);
      socket.off('reconnect',       onReconnect);
      socket.off('expense:added',   onExpenseAdded);
      socket.off('expense:updated', onExpenseUpdated);
      socket.off('split:paid',      onSplitPaid);
      socket.off('balance:updated', onBalanceUpdated);
      socket.off('expense:deleted', onExpenseDeleted);
      socket.off('member:removed',  onMemberRemoved);
      socket.emit('leave:room', { roomId });
    };
  }, [roomId]);

  const emit = useCallback((event, data) => {
    const socket = getSocket();
    socket.emit(event, data);
  }, []);

  return { emit, connected };
}
