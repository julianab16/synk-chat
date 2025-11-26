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

  // Mapa para trackear usuarios en salas
  const userRooms = new Map<string, Set<string>>();





  io.on("connection", (socket: Socket) => {
    console.log(`✅ Usuario conectado: ${socket.id}`);

    /**
     * Unirse a una sala







     */
    socket.on("joinRoom", async (roomId: string) => {
      try {


        validateRoomId(roomId);






        socket.join(roomId);

        // Trackear usuario en sala
        if (!userRooms.has(roomId)) {
          userRooms.set(roomId, new Set());
        }
        userRooms.get(roomId)?.add(socket.id);

        console.log(`👥 Usuario ${socket.id} entró a sala ${roomId}`);

        // Notificar a otros usuarios en la sala
        socket.to(roomId).emit("userJoined", {
          userId: socket.id,

          roomId,
          timestamp: new Date(),
          activeUsers: userRooms.get(roomId)?.size || 0
        });

        // Enviar confirmación al usuario
        socket.emit("joinedRoom", {
          roomId,

          activeUsers: userRooms.get(roomId)?.size || 0,
          message: "Te has unido a la sala exitosamente"
        });

      } catch (error) {
        console.error("❌ Error al unirse a sala:", error);
        const errorMessage: SocketError = {
          error: error instanceof ValidationError 
            ? error.message 
            : "No se pudo unir a la sala"
        };
        socket.emit("roomError", errorMessage);
      }
    });

    /**
     * Salir de una sala



     */
    socket.on("leaveRoom", (roomId: string) => {
      try {
        validateRoomId(roomId);

        socket.leave(roomId);

        // Remover usuario del tracking
        userRooms.get(roomId)?.delete(socket.id);

        if (userRooms.get(roomId)?.size === 0) {
          userRooms.delete(roomId);
        }

        console.log(`👋 Usuario ${socket.id} salió de sala ${roomId}`);

        // Notificar a otros usuarios
        socket.to(roomId).emit("userLeft", {
          userId: socket.id,
          roomId,
          timestamp: new Date(),
          activeUsers: userRooms.get(roomId)?.size || 0
        });

      } catch (error) {
        console.error("❌ Error al salir de sala:", error);
      }
    });

    /**
     * Enviar mensaje



     */
    socket.on("sendMessage", async (data: SendMessageData) => {
      try {
        // Validar datos
        validateMessage(data);

        const { roomId, sender, message } = data;

        // Verificar que el usuario esté en la sala
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(roomId)) {
          throw new ValidationError("No estás en esta sala");
        }

        // Guardar mensaje en Firestore
        const saved = await chatService.saveMessage(roomId, sender, message);

        console.log(`💬 Mensaje enviado en sala ${roomId} por ${sender}`);

        // Emitir mensaje a todos en la sala
        io.to(roomId).emit("receiveMessage", saved);

      } catch (error) {
        console.error("❌ Error enviando mensaje:", error);

        const errorMessage: SocketError = {
          error: error instanceof ValidationError 
            ? error.message 
            : "No se pudo enviar el mensaje",
          details: error instanceof Error ? error.message : undefined
        };

        socket.emit("messageError", errorMessage);
      }
    });

    /**
     * Usuario está escribiendo

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
        console.error("❌ Error en evento typing:", error);
      }
    });

    /**
     * Obtener usuarios activos en una sala

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
        console.error("❌ Error obteniendo usuarios activos:", error);
      }
    });

    /**
     * Desconexión

     */
    socket.on("disconnect", (reason: string) => {
      console.log(`🔌 Usuario desconectado: ${socket.id} - Razón: ${reason}`);

      // Limpiar usuario de todas las salas
      userRooms.forEach((users, roomId) => {
        if (users.has(socket.id)) {

          users.delete(socket.id);

          // Notificar a la sala
          socket.to(roomId).emit("userLeft", {
            userId: socket.id,
            roomId,
            timestamp: new Date(),
            activeUsers: users.size
          });

          // Eliminar sala si está vacía
          if (users.size === 0) {
            userRooms.delete(roomId);
          }
        }
      });
    });

    /**
     * Manejo de errores generales

     */
    socket.on("error", (error: Error) => {
      console.error(`❌ Error en socket ${socket.id}:`, error);
      socket.emit("socketError", {
        error: "Error en la conexión",
        details: error.message
      });
    });
  });

  /**
   * Server-level connection error handler
   * Logs connection errors at the engine level
   * @event connection_error
   * @param {Error} err - Connection error
   */
  io.engine.on("connection_error", (err: any) => {
    console.error("❌ Error de conexión del servidor:", err);
  });

  console.log("🚀 Socket.IO inicializado correctamente");

  return io;
};