import { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { validateRoomId, ValidationError } from "../utils/validation";

const service = new ChatService();

/**
 * Obtiene el historial de mensajes de una sala
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    // Validar roomId
    validateRoomId(roomId);

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

  } catch (error) {
    console.error("Error cargando historial:", error);
    
    if (error instanceof ValidationError) {
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

/**
 * Obtiene los mensajes recientes de una sala
 */
export const getRecentMessages = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    validateRoomId(roomId);

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

  } catch (error) {
    console.error("Error obteniendo mensajes recientes:", error);
    
    if (error instanceof ValidationError) {
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

/**
 * Verifica si una sala existe
 */
export const checkRoom = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;

    validateRoomId(roomId);

    const exists = await service.roomExists(roomId);
    
    res.json({
      success: true,
      roomId,
      exists
    });

  } catch (error) {
    console.error("Error verificando sala:", error);
    
    if (error instanceof ValidationError) {
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

/**
 * Elimina mensajes antiguos de una sala
 */
export const cleanOldMessages = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const daysOld = req.body.daysOld || 30;

    validateRoomId(roomId);

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

  } catch (error) {
    console.error("Error limpiando mensajes:", error);
    
    if (error instanceof ValidationError) {
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