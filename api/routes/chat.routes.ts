import { Router } from "express";
import { 
  getHistory, 
  getRecentMessages, 
  checkRoom, 
  cleanOldMessages 
} from "../controllers/chat.controller";

/**
 * Express router for chat-related endpoints
 * @module routes/chat
 */
const router = Router();

/**
 * Get complete message history for a chat room
 * @route GET /api/chat/:roomId/history
 * @param {string} roomId - The unique identifier of the chat room
 * @query {number} [limit] - Optional maximum number of messages to retrieve (1-1000)
 * @returns {Object} JSON response with message history
 * @example
 * GET /api/chat/room123/history?limit=100
 */
router.get("/:roomId/history", getHistory);

/**
 * Get recent messages from a chat room
 * @route GET /api/chat/:roomId/recent
 * @param {string} roomId - The unique identifier of the chat room
 * @query {number} [limit] - Optional maximum number of messages to retrieve (1-100, default: 50)
 * @returns {Object} JSON response with recent messages
 * @example
 * GET /api/chat/room123/recent?limit=20
 */
router.get("/:roomId/recent", getRecentMessages);

/**
 * Check if a chat room exists
 * @route GET /api/chat/:roomId/check
 * @param {string} roomId - The unique identifier of the chat room
 * @returns {Object} JSON response indicating room existence
 * @example
 * GET /api/chat/room123/check
 * Response: { "success": true, "roomId": "room123", "exists": true }
 */
router.get("/:roomId/check", checkRoom);

/**
 * Delete old messages from a chat room
 * @route DELETE /api/chat/:roomId/clean
 * @param {string} roomId - The unique identifier of the chat room
 * @body {number} [daysOld=30] - Number of days to keep messages (default: 30)
 * @returns {Object} JSON response with count of deleted messages
 * @security Requires authentication in production environments
 * @example
 * DELETE /api/chat/room123/clean
 * Body: { "daysOld": 60 }
 * Response: { "success": true, "roomId": "room123", "deletedCount": 150, "message": "150 messages deleted" }
 */
router.delete("/:roomId/clean", cleanOldMessages);

/**
 * Legacy route for backward compatibility
 * @route GET /api/chat/:roomId
 * @param {string} roomId - The unique identifier of the chat room
 * @returns {Object} JSON response with message history
 * @deprecated Use /api/chat/:roomId/history instead
 * @example
 * GET /api/chat/room123
 */
router.get("/:roomId", getHistory);

export default router;