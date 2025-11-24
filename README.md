# 💬 Chat Service - Real-Time Chat

Sistema de chat en tiempo real con Socket.IO, Express y Firebase Firestore.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Agregar serviceAccountKey.json de Firebase en /api

# Iniciar servidor
npm run dev
```

Servidor en `http://localhost:4001`

## 📋 Características

- ✅ Chat en tiempo real con Socket.IO
- ✅ Múltiples salas simultáneas
- ✅ Persistencia en Firebase Firestore
- ✅ Tracking de usuarios activos
- ✅ Indicador "está escribiendo..."
- ✅ API REST para historial
- ✅ TypeScript + Validaciones

## 🔧 Configuración

Edita `.env`:

```env
PORT=4001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 📡 API Endpoints

```bash
GET  /api/chat/:roomId/history      # Obtener historial
GET  /api/chat/:roomId/recent       # Mensajes recientes
GET  /api/chat/:roomId/check        # Verificar sala
DELETE /api/chat/:roomId/clean      # Limpiar mensajes antiguos
```

## 🔌 Eventos Socket.IO

### Cliente → Servidor
- `joinRoom(roomId)` - Unirse a sala
- `leaveRoom(roomId)` - Salir de sala
- `sendMessage({ roomId, sender, message })` - Enviar mensaje
- `typing({ roomId, sender, isTyping })` - Indicar escritura
- `getActiveUsers(roomId)` - Obtener usuarios activos

### Servidor → Cliente
- `joinedRoom` - Confirmación de unión
- `receiveMessage` - Nuevo mensaje
- `userJoined` - Usuario entró
- `userLeft` - Usuario salió
- `userTyping` - Usuario escribiendo
- `messageError` - Error de mensaje

## 💻 Ejemplo Frontend

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4001');

// Unirse a sala
socket.emit('joinRoom', 'room-123');

// Enviar mensaje
socket.emit('sendMessage', {
  roomId: 'room-123',
  sender: 'Juan',
  message: 'Hola!'
});

// Recibir mensajes
socket.on('receiveMessage', (message) => {
  console.log(message);
});
```

## 📦 Estructura

```
api/
├── controllers/     # Controladores REST
├── services/        # Lógica de negocio
├── routes/          # Rutas API
├── types/           # Tipos TypeScript
├── utils/           # Validaciones
├── socket.ts        # Socket.IO
├── firebase.ts      # Firebase config
└── index.ts         # Servidor
```

## 🛠 Stack

- Node.js + Express
- Socket.IO v4
- Firebase Admin SDK
- TypeScript
- CORS + dotenv

## 📝 Scripts

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Compilar TypeScript
npm start        # Producción
```
