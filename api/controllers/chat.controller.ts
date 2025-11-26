import { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { validateRoomId, ValidationError } from "../utils/validation";

const service = new ChatService();

/**
 * Retrieves the message history for a chat room
 * @route GET /api/chat/:roomId/history
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with message history
 * @throws {ValidationError} If roomId is invalid
 * @throws {Error} If there's a server error fetching messages
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    // Validate room ID format
    validateRoomId(roomId);

    // Validate limit parameter if provided
    if (limit && (isNaN(limit) || limit < 1 || limit > 1000)) {
      return res.status(400).json({ 
        error: "The 'limit' parameter must be a number between 1 and 1000" 
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
    console.error("Error loading history:", error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: "Error loading history" 
    });
  }
};

/**
 * Retrieves recent messages from a chat room
 * @route GET /api/chat/:roomId/recent
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with recent messages (default: 50)
 * @throws {ValidationError} If roomId is invalid
 * @throws {Error} If there's a server error fetching messages
 */
export const getRecentMessages = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    validateRoomId(roomId);

    // Validate limit is within acceptable range
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ 
        error: "The 'limit' parameter must be a number between 1 and 100" 
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
    console.error("Error retrieving recent messages:", error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: "Error retrieving recent messages" 
    });
  }
};

/**
 * Checks if a chat room exists
 * @route GET /api/chat/:roomId/check
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response indicating if the room exists
 * @throws {ValidationError} If roomId is invalid
 * @throws {Error} If there's a server error checking room existence
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
    console.error("Error checking room:", error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: "Error checking room" 
    });
  }
};

/**
 * Deletes old messages from a chat room
 * @route DELETE /api/chat/:roomId/clean
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with the count of deleted messages
 * @throws {ValidationError} If roomId is invalid or daysOld is not a positive number
 * @throws {Error} If there's a server error deleting messages
 * @description Requires authentication in production environments
 */
export const cleanOldMessages = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const daysOld = req.body.daysOld || 30; // Default: 30 days

    validateRoomId(roomId);

    // Validate daysOld is a positive number
    if (isNaN(daysOld) || daysOld < 1) {
      return res.status(400).json({ 
        error: "daysOld must be a number greater than 0" 
      });
    }

    const deletedCount = await service.deleteOldMessages(roomId, daysOld);
    
    res.json({
      success: true,
      roomId,
      deletedCount,
      message: `${deletedCount} messages deleted`
    });

  } catch (error) {
    console.error("Error cleaning messages:", error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      error: "Error cleaning messages" 
    });
  }
};