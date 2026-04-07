import express from "express";
import {
  sendMessage,
  textToSpeech,
  getHistory,
  getSessions,
  deleteSession,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/message",       sendMessage);
router.post("/tts",           textToSpeech);    // ← ElevenLabs TTS endpoint
router.get("/history/:sessionId", getHistory);
router.get("/sessions",       getSessions);
router.delete("/session/:sessionId", deleteSession);

export default router;
