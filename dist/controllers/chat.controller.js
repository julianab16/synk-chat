"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanOldMessages = exports.checkRoom = exports.getRecentMessages = exports.getHistory = void 0;
const chat_service_1 = require("../services/chat.service");
const validation_1 = require("../utils/validation");
const service = new chat_service_1.ChatService();
/**
 * Obtiene el historial de mensajes de una sala
 */
const getHistory = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        // Validar roomId
        (0, validation_1.validateRoomId)(roomId);
        // Validar limit si existe
        if (limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
            return res.status(400).json({
                error: "El parámetro 'limit' debe ser un número entre 1 y 1000"
            });
        }
        const messages = await service.getHistory(roomId, limit);
        res.json({
            success: true,
            roomId,
            count: messages.length,
            messages
        });
    }
    catch (error) {
        console.error("Error cargando historial:", error);
        if (error instanceof validation_1.ValidationError) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: "Error cargando historial"
        });
    }
};
exports.getHistory = getHistory;
/**
 * Obtiene los mensajes recientes de una sala
 */
const getRecentMessages = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        (0, validation_1.validateRoomId)(roomId);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                error: "El parámetro 'limit' debe ser un número entre 1 y 100"
            });
        }
        const messages = await service.getRecentMessages(roomId, limit);
        res.json({
            success: true,
            roomId,
            count: messages.length,
            messages
        });
    }
    catch (error) {
        console.error("Error obteniendo mensajes recientes:", error);
        if (error instanceof validation_1.ValidationError) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: "Error obteniendo mensajes recientes"
        });
    }
};
exports.getRecentMessages = getRecentMessages;
/**
 * Verifica si una sala existe
 */
const checkRoom = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        (0, validation_1.validateRoomId)(roomId);
        const exists = await service.roomExists(roomId);
        res.json({
            success: true,
            roomId,
            exists
        });
    }
    catch (error) {
        console.error("Error verificando sala:", error);
        if (error instanceof validation_1.ValidationError) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: "Error verificando sala"
        });
    }
};
exports.checkRoom = checkRoom;
/**
 * Elimina mensajes antiguos de una sala
 */
const cleanOldMessages = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const daysOld = req.body.daysOld || 30;
        (0, validation_1.validateRoomId)(roomId);
        if (isNaN(daysOld) || daysOld < 1) {
            return res.status(400).json({
                error: "daysOld debe ser un número mayor a 0"
            });
        }
        const deletedCount = await service.deleteOldMessages(roomId, daysOld);
        res.json({
            success: true,
            roomId,
            deletedCount,
            message: `Se eliminaron ${deletedCount} mensajes`
        });
    }
    catch (error) {
        console.error("Error limpiando mensajes:", error);
        if (error instanceof validation_1.ValidationError) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: "Error limpiando mensajes"
        });
    }
};
exports.cleanOldMessages = cleanOldMessages;
