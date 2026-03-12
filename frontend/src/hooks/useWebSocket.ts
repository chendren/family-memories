import { useEffect, useState, useCallback } from 'react';
import wsClient from '@/services/ws';

interface WsEvent {
  type: string;
  data: unknown;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);

  useEffect(() => {
    const onConnected = () => setIsConnected(true);
    const onDisconnected = () => setIsConnected(false);

    wsClient.on('connected', onConnected);
    wsClient.on('disconnected', onDisconnected);
    wsClient.connect();

    return () => {
      wsClient.off('connected', onConnected);
      wsClient.off('disconnected', onDisconnected);
      wsClient.disconnect();
    };
  }, []);

  const subscribe = useCallback((event: string, handler: (data: unknown) => void) => {
    const wrappedHandler = (data: unknown) => {
      setLastEvent({ type: event, data });
      handler(data);
    };
    wsClient.on(event, wrappedHandler);
    return () => wsClient.off(event, wrappedHandler);
  }, []);

  return { isConnected, lastEvent, subscribe };
}
