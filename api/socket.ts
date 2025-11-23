import { Server } from "socket.io";
import { ChatService } from "./services/chat.service";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  const chatService = new ChatService();

  io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Usuario ${socket.id} entró a sala ${roomId}`);
    });

    socket.on("sendMessage", async ({ roomId, sender, message }) => {
      const saved = await chatService.saveMessage(roomId, sender, message);

      io.to(roomId).emit("receiveMessage", saved);
    });

    socket.on("disconnect", () => {
      console.log("Usuario desconectado:", socket.id);
    });
  });
};
