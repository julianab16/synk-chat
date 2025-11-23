import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./socket";
import chatRoutes from "./routes/chat.routes";
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes);

initSocket(server);

server.listen(4001, () => {
  console.log("chat-service corriendo en puerto 4001");
});
