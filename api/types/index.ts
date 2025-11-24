// Tipos y interfaces para el chat
export interface Message {
  roomId: string;
  sender: string;
  message: string;
  timestamp: Date;
}

export interface MessageResponse extends Message {
  id?: string;
}

export interface SocketError {
  error: string;
  details?: string;
}

export interface JoinRoomData {
  roomId: string;
  userId?: string;
}

export interface SendMessageData {
  roomId: string;
  sender: string;
  message: string;
}

export interface UserStatus {
  userId: string;
  roomId: string;
  status: 'online' | 'offline';
  timestamp: Date;
}