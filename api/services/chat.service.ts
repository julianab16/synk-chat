import { db } from "../firebase";
import { Message, MessageResponse } from "../types/index";
import { sanitizeMessage } from "../utils/validation";

/**
 * ChatService class
 * Handles all chat-related operations including message storage, retrieval, and management
 * Uses Firestore as the underlying database for persistent message storage
 * @class ChatService
 */
export class ChatService {
  /**
   * Name of the Firestore collection storing chat rooms
   * @private
   * @readonly
   */
  private readonly messagesCollection = "rooms";

  /**
   * Maximum number of messages that can be retrieved in a single query
   * Used to prevent excessive data loads and maintain performance
   * @private
   * @readonly
   */
  private readonly maxMessagesPerQuery = 100;

  /**
   * Saves a new message to Firestore
   * Sanitizes the message content before storage and automatically adds a timestamp
   * @async
   * @param {string} roomId - Unique identifier of the chat room
   * @param {string} sender - Username or identifier of the message sender
   * @param {string} message - Content of the message to be saved
   * @returns {Promise<MessageResponse>} The saved message object including generated ID
   * @throws {Error} If the message cannot be saved to Firestore
   * @example
   * const savedMessage = await chatService.saveMessage(
   *   "room123", 
   *   "john_doe", 
   *   "Hello, world!"
   * );
   */
  async saveMessage(
    roomId: string, 
    sender: string, 
    message: string
  ): Promise<MessageResponse> {
    try {
      // Sanitize message to prevent XSS and injection attacks
      const sanitizedMessage = sanitizeMessage(message);
      
      const msg: Message = {
        roomId,
        sender,
        message: sanitizedMessage,
        timestamp: new Date()
      };

      // Add message to Firestore subcollection
      const docRef = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .collection("messages")
        .add(msg);

      return {
        ...msg,
        id: docRef.id
      };
    } catch (error) {
      console.error("Error saving message to Firestore:", error);
      throw new Error("Unable to save message");
    }
  }

  /**
   * Retrieves the message history for a specific chat room
   * Messages are returned in ascending chronological order (oldest first)
   * @async
   * @param {string} roomId - Unique identifier of the chat room
   * @param {number} [limit] - Maximum number of messages to retrieve (defaults to maxMessagesPerQuery)
   * @returns {Promise<MessageResponse[]>} Array of message objects sorted by timestamp
   * @throws {Error} If the message history cannot be retrieved
   * @example
   * // Get last 50 messages
   * const history = await chatService.getHistory("room123", 50);
   * 
   * // Get default limit (100 messages)
   * const fullHistory = await chatService.getHistory("room123");
   */
  async getHistory(roomId: string, limit?: number): Promise<MessageResponse[]> {
    try {
      const queryLimit = limit || this.maxMessagesPerQuery;
      
      const snap = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .collection("messages")
        .orderBy("timestamp", "asc")
        .limit(queryLimit)
        .get();

      // Return empty array if no messages found
      if (snap.empty) {
        return [];
      }

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MessageResponse));
    } catch (error) {
      console.error("Error retrieving message history:", error);
      throw new Error("Unable to retrieve message history");
    }
  }

  /**
   * Retrieves the most recent messages from a chat room
   * Optimized for real-time display, returns messages in chronological order (oldest to newest)
   * @async
   * @param {string} roomId - Unique identifier of the chat room
   * @param {number} [limit=50] - Maximum number of recent messages to retrieve (default: 50)
   * @returns {Promise<MessageResponse[]>} Array of recent messages sorted chronologically
   * @throws {Error} If the recent messages cannot be retrieved
   * @example
   * // Get last 20 messages
   * const recentMessages = await chatService.getRecentMessages("room123", 20);
   * 
   * // Get default 50 messages
   * const messages = await chatService.getRecentMessages("room123");
   */
  async getRecentMessages(roomId: string, limit: number = 50): Promise<MessageResponse[]> {
    try {
      const snap = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .collection("messages")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

      if (snap.empty) {
        return [];
      }

      // Reverse order so newest messages are at the end (chronological order)
      return snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MessageResponse))
        .reverse();
    } catch (error) {
      console.error("Error retrieving recent messages:", error);
      throw new Error("Unable to retrieve recent messages");
    }
  }

  /**
   * Deletes old messages from a chat room for database maintenance
   * Uses batch operations for efficient deletion of multiple documents
   * @async
   * @param {string} roomId - Unique identifier of the chat room
   * @param {number} [daysOld=30] - Age threshold in days; messages older than this will be deleted (default: 30)
   * @returns {Promise<number>} Number of messages successfully deleted
   * @throws {Error} If the old messages cannot be deleted
   * @example
   * // Delete messages older than 60 days
   * const deletedCount = await chatService.deleteOldMessages("room123", 60);
   * console.log(`Deleted ${deletedCount} old messages`);
   * 
   * // Delete messages older than default 30 days
   * const count = await chatService.deleteOldMessages("room123");
   */
  async deleteOldMessages(roomId: string, daysOld: number = 30): Promise<number> {
    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Query for messages older than cutoff date
      const snap = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .collection("messages")
        .where("timestamp", "<", cutoffDate)
        .get();

      if (snap.empty) {
        return 0;
      }

      // Use batch operation for efficient deletion
      const batch = db.batch();
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snap.size;
    } catch (error) {
      console.error("Error deleting old messages:", error);
      throw new Error("Unable to delete old messages");
    }
  }

  /**
   * Checks if a chat room exists in the database
   * @async
   * @param {string} roomId - Unique identifier of the chat room
   * @returns {Promise<boolean>} True if the room exists, false otherwise
   * @example
   * const exists = await chatService.roomExists("room123");
   * if (exists) {
   *   console.log("Room found!");
   * }
   */
  async roomExists(roomId: string): Promise<boolean> {
    try {
      const roomDoc = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .get();

      return roomDoc.exists;
    } catch (error) {
      console.error("Error checking room existence:", error);
      return false;
    }
  }

  /**
   * Creates or updates metadata for a chat room
   * Uses merge operation to preserve existing data while updating specific fields
   * Automatically updates the lastActivity timestamp
   * @async
   * @param {string} roomId - Unique identifier of the chat room
   * @param {any} metadata - Object containing metadata fields to update
   * @returns {Promise<void>}
   * @throws {Error} If the room metadata cannot be updated
   * @example
   * await chatService.updateRoomMetadata("room123", {
   *   name: "Project Discussion",
   *   participants: ["user1", "user2"],
   *   createdBy: "user1"
   * });
   */
  async updateRoomMetadata(roomId: string, metadata: any): Promise<void> {
    try {
      await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .set({
          ...metadata,
          lastActivity: new Date()
        }, { merge: true });
    } catch (error) {
      console.error("Error updating room metadata:", error);
      throw new Error("Unable to update room metadata");
    }
  }
}