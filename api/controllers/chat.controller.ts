import { ChatService } from "../services/chat.service";
import { Request, Response } from "express";

const service = new ChatService();

export const getHistory = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const messages = await service.getHistory(roomId);
    res.json(messages);
  } catch {
    res.status(500).json({ error: "Error cargando historial" });
  }
};
