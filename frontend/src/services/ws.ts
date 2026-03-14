type EventHandler = (data: unknown) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private _isConnected = false;

  constructor(url: string) {
    this.url = url;
  }

  get isConnected() {
    return this._isConnected;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.emit('connected', null);
      };

      this.ws.onclose = () => {
        this._isConnected = false;
        this.emit('disconnected', null);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this._isConnected = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as { type: string; data: unknown };
          this.emit(message.type, message.data);
        } catch {
          // ignore malformed messages
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
  }

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = import.meta.env.DEV ? 'ws://localhost:3142/ws' : `${wsProtocol}//${window.location.host}/ws`;

export const wsClient = new WebSocketClient(wsUrl);
export default wsClient;
