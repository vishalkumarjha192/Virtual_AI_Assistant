import axios from "axios";
import Conversation from "../models/Conversation.js";

const ELEVEN_API_KEY  = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = process.env.ELEVEN_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

const SYSTEM_PROMPT =
  "You are Isabel, a sophisticated and warm AI assistant with a distinctive personality. " +
  "You are helpful, intelligent, witty, and genuinely caring. " +
  "You have deep knowledge across coding, writing, analysis, science, and more. " +
  "Provide clear, thoughtful responses with a conversational friendly tone. " +
  "Use markdown formatting when helpful.";

const sse = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

// ── POST /api/chat/message  (Groq — free tier) ──────────────────────────
export const sendMessage = async (req, res) => {
  const { sessionId, content, inputMode = "text" } = req.body;
  const userId = req.user._id;

  if (!sessionId || !content)
    return res.status(400).json({ error: "sessionId and content are required" });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set in .env" });
  }

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");

  try {
    // ── Load / create conversation ──────────────────────────────────────
    let convo = await Conversation.findOne({ sessionId, userId });
    if (!convo) convo = new Conversation({ sessionId, userId, messages: [] });

    convo.messages.push({ role: "user", content, inputMode });
    if (convo.messages.length === 1)
      convo.title = content.slice(0, 60) + (content.length > 60 ? "…" : "");

    // ── Build messages (system + last 40 turns) ─────────────────────────
    const history = convo.messages.slice(-40).map((m) => ({
      role:    m.role,          // "user" | "assistant"
      content: m.content,
    }));

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ];

    // ── Call Groq with streaming ────────────────────────────────────────
    const groqResp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model:       "llama-3.3-70b-versatile",   // free, fast, smart
        messages,
        stream:      true,
        max_tokens:  1024,
        temperature: 0.75,
      },
      {
        headers: {
          Authorization:  `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout:      30000,
      }
    );

    let fullResponse = "";
    let buffer = "";

    await new Promise((resolve, reject) => {
      groqResp.data.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") { resolve(); continue; }

          try {
            const parsed = JSON.parse(payload);
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              fullResponse += text;
              sse(res, { type: "delta", text });
            }
          } catch { /* ignore parse errors */ }
        }
      });

      groqResp.data.on("end",   resolve);
      groqResp.data.on("error", reject);
    });

    // ── Persist & finish ────────────────────────────────────────────────
    convo.messages.push({ role: "assistant", content: fullResponse, inputMode: "text" });
    await convo.save();

    sse(res, { type: "done", messageId: convo.messages.at(-1)._id });
    res.end();

  } catch (err) {
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    console.error("Chat error:", detail);
    if (res.headersSent) { sse(res, { type: "error", message: detail }); res.end(); }
    else res.status(500).json({ error: detail });
  }
};

// ── POST /api/chat/tts  (ElevenLabs) ───────────────────────────────────
export const textToSpeech = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      {
        text: text.replace(/\n/g, " ").trim(),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.22, similarity_boost: 0.93,
          style: 0.78, use_speaker_boost: true,
        },
      },
      {
        headers: {
          "xi-api-key":   ELEVEN_API_KEY,
          "Content-Type": "application/json",
          Accept:         "audio/mpeg",
        },
        responseType: "arraybuffer",
        timeout:      20000,
      }
    );
    res.setHeader("Content-Type",   "audio/mpeg");
    res.setHeader("Content-Length", response.data.byteLength);
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("TTS error:", err.message);
    res.status(500).json({ error: "TTS failed" });
  }
};

// ── GET /api/chat/history/:sessionId ───────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const convo = await Conversation.findOne({
      sessionId: req.params.sessionId, userId: req.user._id,
    });
    if (!convo) return res.json({ messages: [] });
    res.json({ messages: convo.messages, title: convo.title });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// ── GET /api/chat/sessions ──────────────────────────────────────────────
export const getSessions = async (req, res) => {
  try {
    const sessions = await Conversation.find(
      { userId: req.user._id },
      { sessionId: 1, title: 1, updatedAt: 1, messages: { $slice: -1 } }
    ).sort({ updatedAt: -1 }).limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

// ── DELETE /api/chat/session/:sessionId ────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    await Conversation.deleteOne({ sessionId: req.params.sessionId, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete session" });
  }
};