"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMessage = exports.validateRoomId = exports.validateMessage = exports.ValidationError = void 0;
// Utilidades de validación
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
const validateMessage = (data) => {
    if (!data) {
        throw new ValidationError('Datos vacíos');
    }
    if (!data.roomId || typeof data.roomId !== 'string') {
        throw new ValidationError('roomId inválido o faltante');
    }
    if (!data.sender || typeof data.sender !== 'string') {
        throw new ValidationError('sender inválido o faltante');
    }
    if (!data.message || typeof data.message !== 'string') {
        throw new ValidationError('message inválido o faltante');
    }
    if (data.message.trim().length === 0) {
        throw new ValidationError('El mensaje no puede estar vacío');
    }
    if (data.message.length > 5000) {
        throw new ValidationError('El mensaje es demasiado largo (máximo 5000 caracteres)');
    }
    return true;
};
exports.validateMessage = validateMessage;
const validateRoomId = (roomId) => {
    if (!roomId || typeof roomId !== 'string') {
        throw new ValidationError('roomId inválido');
    }
    if (roomId.trim().length === 0) {
        throw new ValidationError('roomId no puede estar vacío');
    }
    // Validar formato de roomId (solo alfanumérico y guiones)
    const roomIdPattern = /^[a-zA-Z0-9-_]+$/;
    if (!roomIdPattern.test(roomId)) {
        throw new ValidationError('roomId contiene caracteres inválidos');
    }
    return true;
};
exports.validateRoomId = validateRoomId;
const sanitizeMessage = (message) => {
    // Eliminar espacios extras y trim
    return message.trim().replace(/\s+/g, ' ');
};
exports.sanitizeMessage = sanitizeMessage;
