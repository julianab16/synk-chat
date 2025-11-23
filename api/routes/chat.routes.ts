import { Router } from "express";
import { getHistory } from "../controllers/chat.controller";

const router = Router();

router.get("/:roomId", getHistory);

export default router;
