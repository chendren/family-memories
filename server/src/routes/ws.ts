import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import { logger } from '../utils/logger.js';

let wss: WebSocketServer | null = null;

export function broadcast(event: string, data: unknown): void {
  if (!wss) return;

  const message = JSON.stringify({ type: event, data });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function setupWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        logger.debug({ message }, 'WebSocket message received');
      } catch {
        logger.warn('Invalid WebSocket message received');
      }
    });

    ws.on('close', () => {
      logger.debug('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      logger.error({ err }, 'WebSocket error');
    });
  });

  logger.info('WebSocket server initialized');
  return wss;
}

export function closeWebSocket(): void {
  if (wss) {
    wss.close();
    wss = null;
    logger.info('WebSocket server closed');
  }
}
