import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // NOVO: Função para obter URL dinâmica do Socket
  getSocketURL() {
    // Se estamos em desenvolvimento local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Se estamos a aceder via IP público, usar o mesmo IP para Socket
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    // Se o frontend está numa porta específica, Socket está na 5000
    if (currentPort === '3000') {
      return `http://${currentHost}:5000`;
    }
    
    // Se frontend e backend estão na mesma porta (produção)
    return `http://${currentHost}:${window.location.port || 5000}`;
  }

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('kpcloud_token');
    if (!token) return;

    // CORREÇÃO: Usar URL dinâmica
    const socketURL = this.getSocketURL();
    console.log('🔌 Conectando Socket.IO a:', socketURL);

    this.socket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Tentar WebSocket primeiro, depois polling
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado do servidor WebSocket:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      console.log('🔄 Tentando reconectar...');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconectado após', attemptNumber, 'tentativas');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falha ao reconectar WebSocket');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  joinFolder(folderId) {
    if (this.socket?.connected) {
      this.socket.emit('join-folder', folderId || 'root');
      console.log('📁 Juntou-se à pasta:', folderId || 'root');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket não conectado. Evento não enviado:', event);
    }
  }

  // NOVO: Verificar se está conectado
  isConnected() {
    return this.socket?.connected || false;
  }

  // NOVO: Obter ID da conexão
  getSocketId() {
    return this.socket?.id || null;
  }
}

export default new SocketService();
