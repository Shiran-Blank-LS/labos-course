const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'chatbot.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'New chat',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at);
`);

function getConversations() {
  return db
    .prepare(
      `
    SELECT c.id, c.title, c.created_at, c.updated_at,
           (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user'
            ORDER BY created_at ASC LIMIT 1) AS preview
    FROM conversations c
    ORDER BY c.updated_at DESC
  `
    )
    .all();
}

function getMessages(conversationId) {
  return db
    .prepare(
      `
    SELECT id, role, content, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `
    )
    .all(conversationId);
}

function createConversation(title = 'New chat') {
  const result = db
    .prepare(`INSERT INTO conversations (title) VALUES (?)`)
    .run(title);
  return result.lastInsertRowid;
}

function addMessage(conversationId, role, content) {
  const result = db
    .prepare(
      `INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)`
    )
    .run(conversationId, role, content);

  db.prepare(
    `UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`
  ).run(conversationId);

  return result.lastInsertRowid;
}

function updateConversationTitle(conversationId, title) {
  db.prepare(`UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?`).run(
    title,
    conversationId
  );
}

function deleteConversation(conversationId) {
  db.prepare(`DELETE FROM conversations WHERE id = ?`).run(conversationId);
}

function removeLastMessage(conversationId, role = 'user') {
  db.prepare(
    `
    DELETE FROM messages WHERE id = (
      SELECT id FROM messages WHERE conversation_id = ? AND role = ?
      ORDER BY created_at DESC LIMIT 1
    )
  `
  ).run(conversationId, role);
}

function deleteConversationIfEmpty(conversationId) {
  const { count } = db
    .prepare(`SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?`)
    .get(conversationId);
  if (count === 0) {
    deleteConversation(conversationId);
    return true;
  }
  return false;
}

function getConversationHistory(conversationId) {
  return getMessages(conversationId).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
}

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  addMessage,
  updateConversationTitle,
  deleteConversation,
  deleteConversationIfEmpty,
  removeLastMessage,
  getConversationHistory,
};
