/**
 * Validation utilities for chat application
 * Provides functions to validate and sanitize user input to prevent security issues
 * @module utils/validation
 */

/**
 * Custom error class for validation failures
 * Extends the native Error class to provide specific validation error handling
 * @class ValidationError
 * @extends Error
 * @property {string} name - Always set to 'ValidationError' for easy error type checking
 * @example
 * throw new ValidationError('Invalid input provided');
 * 
 * try {
 *   validateMessage(data);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('Validation failed:', error.message);
 *   }
 * }
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a complete message object before processing
 * Ensures all required fields are present and meet security/length requirements
 * @function validateMessage
 * @param {any} data - Message data object to validate
 * @returns {boolean} Returns true if validation passes
 * @throws {ValidationError} If any validation rule fails
 * @throws {ValidationError} If data is null or undefined
 * @throws {ValidationError} If roomId is missing or not a string
 * @throws {ValidationError} If sender is missing or not a string
 * @throws {ValidationError} If message is missing or not a string
 * @throws {ValidationError} If message is empty after trimming
 * @throws {ValidationError} If message exceeds 5000 characters
 * @example
 * const messageData = {
 *   roomId: "room123",
 *   sender: "john_doe",
 *   message: "Hello, world!"
 * };
 * 
 * try {
 *   validateMessage(messageData);
 *   // Validation passed, proceed with message processing
 * } catch (error) {
 *   console.error('Invalid message:', error.message);
 * }
 */
export const validateMessage = (data: any): boolean => {
  // Check if data exists
  if (!data) {
    throw new ValidationError('Empty data');
  }

  // Validate roomId field
  if (!data.roomId || typeof data.roomId !== 'string') {
    throw new ValidationError('Invalid or missing roomId');
  }

  // Validate sender field
  if (!data.sender || typeof data.sender !== 'string') {
    throw new ValidationError('Invalid or missing sender');
  }

  // Validate message field
  if (!data.message || typeof data.message !== 'string') {
    throw new ValidationError('Invalid or missing message');
  }

  // Check message is not empty after trimming whitespace
  if (data.message.trim().length === 0) {
    throw new ValidationError('Message cannot be empty');
  }

  // Enforce maximum message length
  if (data.message.length > 5000) {
    throw new ValidationError('Message is too long (maximum 5000 characters)');
  }

  return true;
};

/**
 * Validates a room ID to ensure it meets format and security requirements
 * Prevents SQL injection and ensures consistent room ID format
 * @function validateRoomId
 * @param {any} roomId - Room identifier to validate
 * @returns {boolean} Returns true if validation passes
 * @throws {ValidationError} If roomId is null, undefined, or not a string
 * @throws {ValidationError} If roomId is empty after trimming
 * @throws {ValidationError} If roomId contains invalid characters (only alphanumeric, hyphens, and underscores allowed)
 * @example
 * // Valid room IDs
 * validateRoomId("room123");           // ✓ Pass
 * validateRoomId("project-chat_2024"); // ✓ Pass
 * 
 * // Invalid room IDs
 * validateRoomId("room 123");          // ✗ Throws: contains space
 * validateRoomId("room@123");          // ✗ Throws: contains special character
 * validateRoomId("");                  // ✗ Throws: empty string
 */
export const validateRoomId = (roomId: any): boolean => {
  // Check if roomId exists and is a string
  if (!roomId || typeof roomId !== 'string') {
    throw new ValidationError('Invalid roomId');
  }

  // Check roomId is not empty after trimming
  if (roomId.trim().length === 0) {
    throw new ValidationError('roomId cannot be empty');
  }

  // Validate roomId format (only alphanumeric characters, hyphens, and underscores)
  const roomIdPattern = /^[a-zA-Z0-9-_]+$/;
  if (!roomIdPattern.test(roomId)) {
    throw new ValidationError('roomId contains invalid characters');
  }

  return true;
};

/**
 * Sanitizes a message string by removing extra whitespace
 * Helps prevent formatting issues and reduces message storage size
 * @function sanitizeMessage
 * @param {string} message - Raw message string to sanitize
 * @returns {string} Sanitized message with trimmed edges and normalized whitespace
 * @example
 * // Remove extra spaces
 * sanitizeMessage("Hello    world");     // Returns: "Hello world"
 * 
 * // Trim leading and trailing whitespace
 * sanitizeMessage("  Hello world  ");    // Returns: "Hello world"
 * 
 * // Normalize multiple spaces and newlines
 * sanitizeMessage("Hello\n\n  world");   // Returns: "Hello world"
 */
export const sanitizeMessage = (message: string): string => {
  // Remove leading/trailing whitespace and normalize internal whitespace to single spaces
  return message.trim().replace(/\s+/g, ' ');
};