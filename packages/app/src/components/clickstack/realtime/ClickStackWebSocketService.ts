interface WebSocketMessage {
  type: 'metrics' | 'event' | 'alert' | 'notification' | 'error';
  data: any;
  timestamp: string;
  teamId: string;
}

interface WebSocketConfig {
  url: string;
  teamId: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

interface WebSocketEventHandlers {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

export class ClickStackWebSocketService {
  private static instance: ClickStackWebSocketService;
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isConnected = false;

  private constructor(config: WebSocketConfig) {
    this.config = config;
  }

  public static getInstance(config?: WebSocketConfig): ClickStackWebSocketService {
    if (!ClickStackWebSocketService.instance && config) {
      ClickStackWebSocketService.instance = new ClickStackWebSocketService(config);
    }
    return ClickStackWebSocketService.instance;
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.config.url);
      
      this.socket.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.handlers.onConnect?.();
        this.startHeartbeat();
        this.authenticate();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handlers.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.handlers.onDisconnect?.();
        
        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        this.isConnecting = false;
        this.handlers.onError?.(error);
      };

    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'User disconnect');
      this.socket = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Send message through WebSocket
   */
  send(message: Partial<WebSocketMessage>): void {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket is not connected');
    }

    const fullMessage: WebSocketMessage = {
      type: message.type || 'event',
      data: message.data || {},
      timestamp: new Date().toISOString(),
      teamId: this.config.teamId,
      ...message
    };

    this.socket.send(JSON.stringify(fullMessage));
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventTypes: string[]): void {
    this.send({
      type: 'notification',
      data: {
        action: 'subscribe',
        eventTypes
      }
    });
  }

  /**
   * Unsubscribe from specific event types
   */
  unsubscribe(eventTypes: string[]): void {
    this.send({
      type: 'notification',
      data: {
        action: 'unsubscribe',
        eventTypes
      }
    });
  }

  /**
   * Request real-time metrics
   */
  requestMetrics(): void {
    this.send({
      type: 'metrics',
      data: {
        action: 'request'
      }
    });
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Authenticate with the server
   */
  private authenticate(): void {
    this.send({
      type: 'notification',
      data: {
        action: 'authenticate',
        teamId: this.config.teamId
      }
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'notification',
          data: {
            action: 'heartbeat',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.handlers.onReconnect?.(this.reconnectAttempts);

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): WebSocketConfig {
    return { ...this.config };
  }
}

// Default configuration
const defaultConfig: WebSocketConfig = {
  url: 'ws://localhost:3000/ws/clickstack',
  teamId: '',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000
};

// Export singleton instance
export const clickStackWebSocketService = ClickStackWebSocketService.getInstance(defaultConfig);
