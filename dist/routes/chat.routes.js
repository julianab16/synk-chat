"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
// Obtener historial completo de una sala
router.get("/:roomId/history", chat_controller_1.getHistory);
// Obtener mensajes recientes de una sala
router.get("/:roomId/recent", chat_controller_1.getRecentMessages);
// Verificar si una sala existe
router.get("/:roomId/check", chat_controller_1.checkRoom);
// Limpiar mensajes antiguos (requiere autenticación en producción)
router.delete("/:roomId/clean", chat_controller_1.cleanOldMessages);
// Ruta legacy para compatibilidad
router.get("/:roomId", chat_controller_1.getHistory);
exports.default = router;
