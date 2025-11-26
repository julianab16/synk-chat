/**
 * Main application entry point
 * Initializes Express server, Socket.IO, and configures middleware for the chat service
 * @module index
 */

import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./socket";
import chatRoutes from "./routes/chat.routes";
import dotenv from "dotenv";

/**
 * Load environment variables from .env file
 * Must be called before accessing process.env variables
 */
dotenv.config();

/**
 * Express application instance
 * @constant {express.Application}
 */
const app = express();

/**
 * HTTP server instance wrapping the Express app
 * Required for Socket.IO integration
 * @constant {http.Server}
 */
const server = http.createServer(app);

/**
 * CORS (Cross-Origin Resource Sharing) configuration options
 * Controls which domains can access the API
 * @constant {Object}
 * @property {string} origin - Allowed origin domain (from env or wildcard)
 * @property {boolean} credentials - Allow credentials in requests
 * @property {number} optionsSuccessStatus - Success status code for preflight requests
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Apply CORS middleware to allow cross-origin requests
 */
app.use(cors(corsOptions));

/**
 * Parse incoming JSON payloads with a 10MB size limit
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Parse URL-encoded form data with a 10MB size limit
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Health check endpoint
 * Used for monitoring service availability and uptime checks
 * @route GET /health
 * @returns {Object} JSON response with service status
 * @returns {string} returns.status - Always "OK" if service is running
 * @returns {string} returns.service - Service identifier
 * @returns {string} returns.timestamp - ISO timestamp of the request
 * @example
 * GET /health
 * Response: {
 *   "status": "OK",
 *   "service": "chat-service",
 *   "timestamp": "2024-11-25T15:30:00.000Z"
 * }
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    service: "chat-service",
    timestamp: new Date().toISOString()
  });
});

/**
 * Mount chat-related routes under /api/chat prefix
 * All chat endpoints are accessible via /api/chat/*
 */
app.use("/api/chat", chatRoutes);

/**
 * 404 Not Found handler for undefined routes
 * Catches all requests that don't match defined routes
 * @route ALL *
 * @returns {Object} JSON error response
 * @returns {string} returns.error - Error message in Spanish
 * @returns {string} returns.path - The requested path that was not found
 * @example
 * GET /api/unknown
 * Response: {
 *   "error": "Ruta no encontrada",
 *   "path": "/api/unknown"
 * }
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl
  });
});

/**
 * Global error handling middleware
 * Catches and processes all unhandled errors in the application
 * @param {Error} err - Error object thrown by the application
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {Object} JSON error response
 * @returns {string} returns.error - Generic error message
 * @returns {string} [returns.message] - Detailed error message (only in development)
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Initialize Socket.IO for real-time bidirectional communication
 * Attaches Socket.IO server to the HTTP server instance
 */
initSocket(server);

/**
 * Server port number
 * Defaults to 4001 if PORT environment variable is not set
 * @constant {number}
 */
const PORT = process.env.PORT || 4001;

/**
 * Start the HTTP server and listen for incoming connections
 * Logs startup information including port, environment, and CORS settings
 * @listens PORT
 */
server.listen(PORT, () => {
  console.log(`🚀 chat-service running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || '*'}`);
});

/**
 * Handle SIGTERM signal for graceful shutdown
 * Triggered by process managers (PM2, Docker, Kubernetes) when stopping the service
 * @listens process#SIGTERM
 */
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

/**
 * Handle SIGINT signal for graceful shutdown
 * Triggered by Ctrl+C in terminal
 * @listens process#SIGINT
 */
process.on('SIGINT', () => {
  console.log('👋 SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

/**
 * Handle uncaught exceptions
 * Logs the error and terminates the process to prevent undefined behavior
 * @listens process#uncaughtException
 * @param {Error} error - The uncaught exception
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 * Logs the error and terminates the process to maintain application integrity
 * @listens process#unhandledRejection
 * @param {*} reason - The rejection reason
 * @param {Promise} promise - The rejected promise
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

/**
 * Export the Express application for testing purposes
 * @exports app
 */
export default app;