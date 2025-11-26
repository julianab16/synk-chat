/**
 * Socket.IO configuration and event handlers
 * Manages real-time bidirectional communication for the chat application
 * @module socket
 */
import { Server, Socket } from "socket.io";
import { ChatService } from "./services/chat.service";
import { validateMessage, validateRoomId, ValidationError } from "./utils/validation";
import { SendMessageData, SocketError } from "./types/index";

/**
 * Initializes and configures Socket.IO server
 * Sets up all event handlers for real-time chat functionality including
 * room management, messaging, typing indicators, and user presence tracking
 * @function initSocket
 * @param {any} server - HTTP server instance to attach Socket.IO
 * @returns {Server} Configured Socket.IO server instance
 * @example
 * import http from 'http';
 * const server = http.createServer(app);
 * const io = initSocket(server);
 */
export const initSocket = (server: any) => {
  /**
   * Socket.IO server instance with CORS and connection settings
   * @constant {Server}
   * @property {Object} cors - CORS configuration for WebSocket connections
   * @property {number} pingTimeout - Time to wait for ping response before disconnecting (60 seconds)
   * @property {number} pingInterval - Interval between ping packets (25 seconds)
   */
  const io = new Server(server, {
    cors: { 
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  const chatService = new ChatService();

  /**
   * Map to track user information in rooms
   * Key: roomId, Value: Map of socketId -> username
   * @type {Map<string, Map<string, string>>}
   */
  const userRooms = new Map<string, Map<string, string>>();

  io.on("connection", (socket: Socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    /**
     * Join room event handler
     * Allows a user to join a specific chat room with their username
     * @event joinRoom
     * @param {Object} data - Join room data
     * @param {string} data.roomId - Unique identifier of the room to join
     * @param {string} data.userId - Username/identifier of the user joining
     * @emits userJoined - Notifies other users about the new participant
     * @emits joinedRoom - Confirms successful room join
     */
    socket.on("joinRoom", async (data: { roomId: string; userId: string }) => {
      try {
        const { roomId, userId } = data;
        
        validateRoomId(roomId);
        
        if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
          throw new ValidationError("Valid userId is required");
        }

        // Add socket to the Socket.IO room
        socket.join(roomId);
        
        // Track user with their username
        if (!userRooms.has(roomId)) {
          userRooms.set(roomId, new Map());
        }
        userRooms.get(roomId)?.set(socket.id, userId);

        console.log(`👥 User ${userId} (${socket.id}) joined room ${roomId}`);
        
        // Notify other users in the room
        socket.to(roomId).emit("userJoined", {
          userId: userId,
          socketId: socket.id,
          roomId,
          timestamp: new Date(),
          activeUsers: userRooms.get(roomId)?.size || 0
        });

        // Send confirmation to the user
        socket.emit("joinedRoom", {
          roomId,
          userId,
          activeUsers: userRooms.get(roomId)?.size || 0,
          message: "Successfully joined the room"
        });

      } catch (error) {
        console.error("❌ Error joining room:", error);
        const errorMessage: SocketError = {
          error: error instanceof ValidationError 
            ? error.message 
            : "Could not join room"
        };
        socket.emit("roomError", errorMessage);
      }
    });

    /**
     * Leave room event handler
     * Removes a user from a chat room
     * @event leaveRoom
     * @param {string} roomId - Room ID to leave
     */
    socket.on("leaveRoom", (roomId: string) => {
      try {
        validateRoomId(roomId);
        
        const userId = userRooms.get(roomId)?.get(socket.id);
        
        socket.leave(roomId);
        userRooms.get(roomId)?.delete(socket.id);
        
        if (userRooms.get(roomId)?.size === 0) {
          userRooms.delete(roomId);
        }

        console.log(`👋 User ${userId} (${socket.id}) left room ${roomId}`);
        
        socket.to(roomId).emit("userLeft", {
          userId: userId || socket.id,
          roomId,
          timestamp: new Date(),
          activeUsers: userRooms.get(roomId)?.size || 0
        });

      } catch (error) {
        console.error("❌ Error leaving room:", error);
      }
    });

    /**
     * Send message event handler
     * Processes and broadcasts a new chat message to all users in the room
     * @event sendMessage
     * @param {SendMessageData} data - Message data object
     */
    socket.on("sendMessage", async (data: SendMessageData) => {
      try {
        validateMessage(data);
        
        const { roomId, sender, message } = data;

        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(roomId)) {
          throw new ValidationError("You are not in this room");
        }

        const saved = await chatService.saveMessage(roomId, sender, message);

        console.log(`💬 Message sent in room ${roomId} by ${sender}`);

        io.to(roomId).emit("receiveMessage", saved);

      } catch (error) {
        console.error("❌ Error sending message:", error);
        
        const errorMessage: SocketError = {
          error: error instanceof ValidationError 
            ? error.message 
            : "Could not send message",
          details: error instanceof Error ? error.message : undefined
        };
        
        socket.emit("messageError", errorMessage);
      }
    });

    /**
     * Typing indicator event handler
     * @event typing
     */
    socket.on("typing", (data: { roomId: string; sender: string; isTyping: boolean }) => {
      try {
        validateRoomId(data.roomId);
        
        socket.to(data.roomId).emit("userTyping", {
          sender: data.sender,
          isTyping: data.isTyping,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("❌ Error in typing event:", error);
      }
    });

    /**
     * Get active users event handler
     * @event getActiveUsers
     */
    socket.on("getActiveUsers", (roomId: string) => {
      try {
        validateRoomId(roomId);
        
        const activeCount = userRooms.get(roomId)?.size || 0;
        socket.emit("activeUsers", {
          roomId,
          count: activeCount,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("❌ Error getting active users:", error);
      }
    });

    /**
     * Disconnect event handler
     * Cleans up user presence when disconnecting
     */
    socket.on("disconnect", (reason: string) => {
      console.log(`🔌 User disconnected: ${socket.id} - Reason: ${reason}`);
      
      userRooms.forEach((users, roomId) => {
        const userId = users.get(socket.id);
        if (userId) {
          users.delete(socket.id);
          
          socket.to(roomId).emit("userLeft", {
            userId: userId,
            roomId,
            timestamp: new Date(),
            activeUsers: users.size
          });

          if (users.size === 0) {
            userRooms.delete(roomId);
          }
        }
      });
    });

    /**
     * General error event handler
     * @event error
     */
    socket.on("error", (error: Error) => {
      console.error(`❌ Error on socket ${socket.id}:`, error);
      socket.emit("socketError", {
        error: "Connection error",
        details: error.message
      });
    });
  });

  /**
   * Server-level connection error handler
   * @event connection_error
   */
  io.engine.on("connection_error", (err: any) => {
    console.error("❌ Server connection error:", err);
  });

  console.log("🚀 Socket.IO initialized successfully");

  return io;
};