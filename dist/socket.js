"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./services/chat.service");
const validation_1 = require("./utils/validation");
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });
    const chatService = new chat_service_1.ChatService();
    // Mapa para trackear usuarios en salas
    const userRooms = new Map();
    io.on("connection", (socket) => {
        console.log(`✅ Usuario conectado: ${socket.id}`);
        /**
         * Unirse a una sala
         */
        socket.on("joinRoom", async (roomId) => {
            try {
                (0, validation_1.validateRoomId)(roomId);
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
            }
            catch (error) {
                console.error("❌ Error al unirse a sala:", error);
                const errorMessage = {
                    error: error instanceof validation_1.ValidationError
                        ? error.message
                        : "No se pudo unir a la sala"
                };
                socket.emit("roomError", errorMessage);
            }
        });
        /**
         * Salir de una sala
         */
        socket.on("leaveRoom", (roomId) => {
            try {
                (0, validation_1.validateRoomId)(roomId);
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
            }
            catch (error) {
                console.error("❌ Error al salir de sala:", error);
            }
        });
        /**
         * Enviar mensaje
         */
        socket.on("sendMessage", async (data) => {
            try {
                // Validar datos
                (0, validation_1.validateMessage)(data);
                const { roomId, sender, message } = data;
                // Verificar que el usuario esté en la sala
                const rooms = Array.from(socket.rooms);
                if (!rooms.includes(roomId)) {
                    throw new validation_1.ValidationError("No estás en esta sala");
                }
                // Guardar mensaje en Firestore
                const saved = await chatService.saveMessage(roomId, sender, message);
                console.log(`💬 Mensaje enviado en sala ${roomId} por ${sender}`);
                // Emitir mensaje a todos en la sala
                io.to(roomId).emit("receiveMessage", saved);
            }
            catch (error) {
                console.error("❌ Error enviando mensaje:", error);
                const errorMessage = {
                    error: error instanceof validation_1.ValidationError
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
        socket.on("typing", (data) => {
            try {
                (0, validation_1.validateRoomId)(data.roomId);
                socket.to(data.roomId).emit("userTyping", {
                    sender: data.sender,
                    isTyping: data.isTyping,
                    timestamp: new Date()
                });
            }
            catch (error) {
                console.error("❌ Error en evento typing:", error);
            }
        });
        /**
         * Obtener usuarios activos en una sala
         */
        socket.on("getActiveUsers", (roomId) => {
            try {
                (0, validation_1.validateRoomId)(roomId);
                const activeCount = userRooms.get(roomId)?.size || 0;
                socket.emit("activeUsers", {
                    roomId,
                    count: activeCount,
                    timestamp: new Date()
                });
            }
            catch (error) {
                console.error("❌ Error obteniendo usuarios activos:", error);
            }
        });
        /**
         * Desconexión
         */
        socket.on("disconnect", (reason) => {
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
        socket.on("error", (error) => {
            console.error(`❌ Error en socket ${socket.id}:`, error);
            socket.emit("socketError", {
                error: "Error en la conexión",
                details: error.message
            });
        });
    });
    // Evento de error del servidor
    io.engine.on("connection_error", (err) => {
        console.error("❌ Error de conexión del servidor:", err);
    });
    console.log("🚀 Socket.IO inicializado correctamente");
    return io;
};
exports.initSocket = initSocket;
