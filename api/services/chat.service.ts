import { db } from "../firebase";
import { Message, MessageResponse } from "../types/index";
import { sanitizeMessage } from "../utils/validation";

export class ChatService {
  private readonly messagesCollection = "rooms";
  private readonly maxMessagesPerQuery = 100;

  /**
   * Guarda un mensaje en Firestore
   */
  async saveMessage(
    roomId: string, 
    sender: string, 
    message: string
  ): Promise<MessageResponse> {
    try {
      const sanitizedMessage = sanitizeMessage(message);
      
      const msg: Message = {
        roomId,
        sender,
        message: sanitizedMessage,
        timestamp: new Date()
      };

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
      console.error("Error guardando mensaje en Firestore:", error);
      throw new Error("No se pudo guardar el mensaje");
    }
  }

  /**
   * Obtiene el historial de mensajes de una sala
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

      if (snap.empty) {
        return [];
      }

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MessageResponse));
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      throw new Error("No se pudo obtener el historial");
    }
  }

  /**
   * Obtiene los últimos N mensajes de una sala
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

      // Invertir el orden para que los más recientes estén al final
      return snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MessageResponse))
        .reverse();
    } catch (error) {
      console.error("Error obteniendo mensajes recientes:", error);
      throw new Error("No se pudieron obtener los mensajes recientes");
    }
  }

  /**
   * Elimina mensajes antiguos de una sala (limpieza)
   */
  async deleteOldMessages(roomId: string, daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const snap = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .collection("messages")
        .where("timestamp", "<", cutoffDate)
        .get();

      if (snap.empty) {
        return 0;
      }

      const batch = db.batch();
      snap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snap.size;
    } catch (error) {
      console.error("Error eliminando mensajes antiguos:", error);
      throw new Error("No se pudieron eliminar mensajes antiguos");
    }
  }

  /**
   * Verifica si una sala existe
   */
  async roomExists(roomId: string): Promise<boolean> {
    try {
      const roomDoc = await db
        .collection(this.messagesCollection)
        .doc(roomId)
        .get();

      return roomDoc.exists;
    } catch (error) {
      console.error("Error verificando sala:", error);
      return false;
    }
  }

  /**
   * Crea o actualiza metadata de una sala
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
      console.error("Error actualizando metadata de sala:", error);
      throw new Error("No se pudo actualizar la sala");
    }
  }
}