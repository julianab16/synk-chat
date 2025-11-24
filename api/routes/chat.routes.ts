import { Router } from "express";
import { 
  getHistory, 
  getRecentMessages, 
  checkRoom, 
  cleanOldMessages 
} from "../controllers/chat.controller";

const router = Router();

// Obtener historial completo de una sala
router.get("/:roomId/history", getHistory);

// Obtener mensajes recientes de una sala
router.get("/:roomId/recent", getRecentMessages);

// Verificar si una sala existe
router.get("/:roomId/check", checkRoom);

// Limpiar mensajes antiguos (requiere autenticación en producción)
router.delete("/:roomId/clean", cleanOldMessages);

// Ruta legacy para compatibilidad
router.get("/:roomId", getHistory);

export default router;