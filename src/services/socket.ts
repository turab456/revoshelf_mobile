import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './backendApi';
import { SOCKET_URL } from '../config';

let socket: Socket | null = null;

export const initSocket = (userId: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Mobile Socket] Connected');
    const token = getAccessToken();
    socket?.emit('register', { userId, token });
  });

  socket.on('disconnect', () => {
    console.log('[Mobile Socket] Disconnected');
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
