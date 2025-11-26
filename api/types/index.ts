/**
 * Type definitions and interfaces for the chat application
 * @module types
 */

/**
 * Base message interface representing a chat message
 * Contains all essential properties of a message stored in the database
 * @interface Message
 * @property {string} roomId - Unique identifier of the chat room where the message belongs
 * @property {string} sender - Username or identifier of the user who sent the message
 * @property {string} message - Content of the message (text)
 * @property {Date} timestamp - Date and time when the message was created
 * @example
 * const message: Message = {
 *   roomId: "room123",
 *   sender: "john_doe",
 *   message: "Hello, everyone!",
 *   timestamp: new Date()
 * };
 */
export interface Message {
  roomId: string;
  sender: string;
  message: string;
  timestamp: Date;
}

/**
 * Extended message interface including the database-generated ID
 * Used when retrieving messages from Firestore or returning saved messages
 * @interface MessageResponse
 * @extends Message
 * @property {string} [id] - Optional unique identifier assigned by Firestore when the message is saved
 * @example
 * const messageResponse: MessageResponse = {
 *   id: "msg_abc123",
 *   roomId: "room123",
 *   sender: "john_doe",
 *   message: "Hello, everyone!",
 *   timestamp: new Date()
 * };
 */
export interface MessageResponse extends Message {
  id?: string;
}

/**
 * Error response structure for Socket.IO events
 * Used to standardize error messages sent to clients via WebSocket
 * @interface SocketError
 * @property {string} error - Brief error message describing what went wrong
 * @property {string} [details] - Optional additional details about the error for debugging
 * @example
 * const error: SocketError = {
 *   error: "Room not found",
 *   details: "The requested room ID does not exist in the database"
 * };
 */
export interface SocketError {
  error: string;
  details?: string;
}

/**
 * Data structure for joining a chat room via Socket.IO
 * Sent by clients when they want to join a specific room
 * @interface JoinRoomData
 * @property {string} roomId - Unique identifier of the room to join
 * @property {string} [userId] - Optional user identifier for tracking who joined the room
 * @example
 * const joinData: JoinRoomData = {
 *   roomId: "room123",
 *   userId: "user_456"
 * };
 * socket.emit("joinRoom", joinData);
 */
export interface JoinRoomData {
  roomId: string;
  userId?: string;
}

/**
 * Data structure for sending a message via Socket.IO
 * Contains all necessary information to create and broadcast a new message
 * @interface SendMessageData
 * @property {string} roomId - Target room where the message should be sent
 * @property {string} sender - Username or identifier of the message sender
 * @property {string} message - Content of the message to be sent
 * @example
 * const messageData: SendMessageData = {
 *   roomId: "room123",
 *   sender: "john_doe",
 *   message: "Hello, world!"
 * };
 * socket.emit("sendMessage", messageData);
 */
export interface SendMessageData {
  roomId: string;
  sender: string;
  message: string;
}

/**
 * User status information for presence tracking
 * Used to track and broadcast user online/offline status in chat rooms
 * @interface UserStatus
 * @property {string} userId - Unique identifier of the user
 * @property {string} roomId - Chat room where the user's status applies
 * @property {'online' | 'offline'} status - Current connection status of the user
 * @property {Date} timestamp - Date and time when the status was last updated
 * @example
 * const userStatus: UserStatus = {
 *   userId: "user_456",
 *   roomId: "room123",
 *   status: "online",
 *   timestamp: new Date()
 * };
 */
export interface UserStatus {
  userId: string;
  roomId: string;
  status: 'online' | 'offline';
  timestamp: Date;
}