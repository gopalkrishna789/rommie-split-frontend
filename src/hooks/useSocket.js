import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socketInstance;
}

/**
 * Hook to manage Socket.io connection and room subscription
 * @param {string|null} roomId - room to join
 * @param {object} handlers - { onExpenseAdded, onSplitPaid, onBalanceUpdated }
 */
export function useSocket(roomId, handlers = {}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      socket.emit('join:room', { roomId });
    };

    const onExpenseAdded = (data) => {
      handlersRef.current.onExpenseAdded?.(data);
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

    socket.on('connect', onConnect);
    socket.on('expense:added', onExpenseAdded);
    socket.on('split:paid', onSplitPaid);
    socket.on('balance:updated', onBalanceUpdated);
    socket.on('expense:deleted', onExpenseDeleted);

    // If already connected, join room immediately
    if (socket.connected) {
      socket.emit('join:room', { roomId });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('expense:added', onExpenseAdded);
      socket.off('split:paid', onSplitPaid);
      socket.off('balance:updated', onBalanceUpdated);
      socket.off('expense:deleted', onExpenseDeleted);
      socket.emit('leave:room', { roomId });
    };
  }, [roomId]);

  const emit = useCallback((event, data) => {
    const socket = getSocket();
    socket.emit(event, data);
  }, []);

  return { emit };
}
