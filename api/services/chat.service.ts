import { db } from "../firebase";

export class ChatService {
  async saveMessage(roomId: string, sender: string, message: string) {
    const msg = {
      roomId,
      sender,
      message,
      timestamp: new Date()
    };

    await db.collection("rooms")
      .doc(roomId)
      .collection("messages")
      .add(msg);

    return msg;
  }

  async getHistory(roomId: string) {
    const snap = await db.collection("rooms")
      .doc(roomId)
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    return snap.docs.map(doc => doc.data());
  }
}
