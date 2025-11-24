"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_1 = require("./socket");
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configuración de CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        service: "chat-service",
        timestamp: new Date().toISOString()
    });
});
// Rutas de chat
app.use("/api/chat", chat_routes_1.default);
// Manejo de rutas no encontradas
app.all("*", (req, res) => {
    res.status(404).json({
        error: "Ruta no encontrada",
        path: req.originalUrl
    });
});
// Manejo de errores global
app.use((err, req, res, next) => {
    console.error("Error no manejado:", err);
    res.status(500).json({
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Inicializar Socket.IO
(0, socket_1.initSocket)(server);
// Puerto desde variable de entorno
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
    console.log(`🚀 chat-service corriendo en puerto ${PORT}`);
    console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS habilitado para: ${process.env.CORS_ORIGIN || '*'}`);
});
// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('👋 SIGINT recibido, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});
exports.default = app;
