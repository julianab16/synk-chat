"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const firebase_1 = require("../firebase");
const validation_1 = require("../utils/validation");
class ChatService {
    constructor() {
        this.messagesCollection = "rooms";
        this.maxMessagesPerQuery = 100;
    }
    /**
     * Guarda un mensaje en Firestore
     */
    async saveMessage(roomId, sender, message) {
        try {
            const sanitizedMessage = (0, validation_1.sanitizeMessage)(message);
            const msg = {
                roomId,
                sender,
                message: sanitizedMessage,
                timestamp: new Date()
            };
            const docRef = await firebase_1.db
                .collection(this.messagesCollection)
                .doc(roomId)
                .collection("messages")
                .add(msg);
            return {
                ...msg,
                id: docRef.id
            };
        }
        catch (error) {
            console.error("Error guardando mensaje en Firestore:", error);
            throw new Error("No se pudo guardar el mensaje");
        }
    }
    /**
     * Obtiene el historial de mensajes de una sala
     */
    async getHistory(roomId, limit) {
        try {
            const queryLimit = limit || this.maxMessagesPerQuery;
            const snap = await firebase_1.db
                .collection(this.messagesCollection)
                .doc(roomId)
                .collection("messages")
                .orderBy("timestamp", "asc")
                .limit(queryLimit)
                .get();
            if (snap.empty) {
                return [];
            }
            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error("Error obteniendo historial:", error);
            throw new Error("No se pudo obtener el historial");
        }
    }
    /**
     * Obtiene los últimos N mensajes de una sala
     */
    async getRecentMessages(roomId, limit = 50) {
        try {
            const snap = await firebase_1.db
                .collection(this.messagesCollection)
                .doc(roomId)
                .collection("messages")
                .orderBy("timestamp", "desc")
                .limit(limit)
                .get();
            if (snap.empty) {
                return [];
            }
            // Invertir el orden para que los más recientes estén al final
            return snap.docs
                .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
                .reverse();
        }
        catch (error) {
            console.error("Error obteniendo mensajes recientes:", error);
            throw new Error("No se pudieron obtener los mensajes recientes");
        }
    }
    /**
     * Elimina mensajes antiguos de una sala (limpieza)
     */
    async deleteOldMessages(roomId, daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const snap = await firebase_1.db
                .collection(this.messagesCollection)
                .doc(roomId)
                .collection("messages")
                .where("timestamp", "<", cutoffDate)
                .get();
            if (snap.empty) {
                return 0;
            }
            const batch = firebase_1.db.batch();
            snap.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            return snap.size;
        }
        catch (error) {
            console.error("Error eliminando mensajes antiguos:", error);
            throw new Error("No se pudieron eliminar mensajes antiguos");
        }
    }
    /**
     * Verifica si una sala existe
     */
    async roomExists(roomId) {
        try {
            const roomDoc = await firebase_1.db
                .collection(this.messagesCollection)
                .doc(roomId)
                .get();
            return roomDoc.exists;
        }
        catch (error) {
            console.error("Error verificando sala:", error);
            return false;
        }
    }
    /**
     * Crea o actualiza metadata de una sala
     */
    async updateRoomMetadata(roomId, metadata) {
        try {
            await firebase_1.db
                .collection(this.messagesCollection)
                .doc(roomId)
                .set({
                ...metadata,
                lastActivity: new Date()
            }, { merge: true });
        }
        catch (error) {
            console.error("Error actualizando metadata de sala:", error);
            throw new Error("No se pudo actualizar la sala");
        }
    }
}
exports.ChatService = ChatService;
