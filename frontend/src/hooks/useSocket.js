import { useSocketContext } from '../context/SocketContext';

/**
 * Hook to access the centralized real-time WebSocket connection and notifications feed.
 */
export const useSocket = () => {
  return useSocketContext();
};

export default useSocket;
