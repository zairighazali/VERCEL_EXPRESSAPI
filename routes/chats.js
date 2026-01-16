import express from "express";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { sendMessageToUser } from "../socket.js";

const router = express.Router();

// Get my chats
router.get("/", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const chats = await pool.query(
    `SELECT * FROM chats WHERE user1_uid=$1 OR user2_uid=$1 ORDER BY created_at DESC`,
    [uid],
  );
  res.json(chats.rows);
});

// Get messages for a chat
// Get messages
router.get("/:chatId/messages", verifyToken, async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const messagesRes = await pool.query(
      `SELECT id, chat_id, sender_uid, content, created_at
       FROM messages
       WHERE chat_id = $1
       ORDER BY created_at ASC`,
      [chatId],
    );

    // selalu return array
    res.json(messagesRes.rows || []);
  } catch (err) {
    console.error("GET /chats/:chatId/messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send message
router.post("/send", verifyToken, async (req, res) => {
  const senderUid = req.user.uid;
  const { receiverUid, content } = req.body;

  if (!content) return res.status(400).json({ message: "Empty message" });

  // ===== Find or create chat =====
  let chatRes = await pool.query(
    `SELECT * FROM chats WHERE (user1_uid=$1 AND user2_uid=$2) OR (user1_uid=$2 AND user2_uid=$1)`,
    [senderUid, receiverUid],
  );

  let chatId;
  if (chatRes.rows.length === 0) {
    const insertChat = await pool.query(
      `INSERT INTO chats (user1_uid, user2_uid) VALUES ($1,$2) RETURNING *`,
      [senderUid, receiverUid],
    );
    chatId = insertChat.rows[0].id;
  } else {
    chatId = chatRes.rows[0].id;
  }

  // ===== Insert message into DB =====
  const msgRes = await pool.query(
    `INSERT INTO messages (chat_id, sender_uid, content) VALUES ($1,$2,$3) RETURNING *`,
    [chatId, senderUid, content],
  );

  const message = msgRes.rows[0];

  // ===== Emit to receiver via socket =====
  sendMessageToUser(receiverUid, {
    ...message,
    chatId,
    senderUid,
  });

  res.json(message); // return object message
});

export default router;
