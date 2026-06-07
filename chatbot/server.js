require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./database');

const app = express();
const PORT = process.env.CHATBOT_PORT || 4000;

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getApiKey(req) {
  return req.headers['x-gemini-api-key']?.trim() || '';
}

function getRequestedModel(req) {
  return req.headers['x-gemini-model']?.trim() || DEFAULT_MODEL;
}

function getModel(apiKey, modelName) {
  if (!apiKey) {
    throw new Error('מפתח API חסר. הזיני אותו בהגדרות באפליקציה.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

function isRateLimitError(err) {
  const msg = err.message || '';
  return (
    msg.includes('429') ||
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('too many requests')
  );
}

function parseGeminiError(err) {
  const msg = err.message || '';

  if (isRateLimitError(err)) {
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const seconds = retryMatch ? Math.ceil(Number(retryMatch[1])) : 60;
    return {
      status: 429,
      error: `חרגת ממכסת Gemini (Free Tier). המתיני ~${seconds} שניות ונסי שוב, או החליפי מודל ל-"Flash Lite" בהגדרות ⚙`,
    };
  }

  if (msg.includes('API key not valid') || msg.includes('403')) {
    return {
      status: 403,
      error: 'מפתח API לא תקין. צרי מפתח חדש ב-https://aistudio.google.com/apikey (מתחיל ב-AIza)',
    };
  }

  return { status: 500, error: msg || 'Failed to get response from Gemini' };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(chat, message, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await chat.sendMessage(message);
    } catch (err) {
      lastError = err;
      if (!isRateLimitError(err) || attempt === maxRetries) throw err;

      const retryMatch = err.message.match(/retry in ([\d.]+)s/i);
      const delayMs = retryMatch ? Math.ceil(Number(retryMatch[1]) * 1000) + 1000 : 15000;
      console.warn(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

function buildModelChain(preferredModel) {
  return [preferredModel, ...FALLBACK_MODELS.filter((m) => m !== preferredModel)];
}

async function sendChatWithFallback(apiKey, preferredModel, history, message) {
  const models = buildModelChain(preferredModel);
  let lastError;

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    try {
      const model = getModel(apiKey, modelName);
      const chat = model.startChat({ history });
      const result = await sendWithRetry(chat, message);
      if (i > 0) console.log(`Fallback succeeded with model: ${modelName}`);
      return { result, modelUsed: modelName };
    } catch (err) {
      lastError = err;
      if (!isRateLimitError(err) || i === models.length - 1) throw err;
      console.warn(`Model ${modelName} rate limited, trying next model...`);
    }
  }

  throw lastError;
}

function truncateTitle(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 48 ? `${cleaned.slice(0, 45)}...` : cleaned;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, defaultModel: DEFAULT_MODEL });
});

app.get('/api/conversations', (_req, res) => {
  res.json(db.getConversations());
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const id = Number(req.params.id);
  const messages = db.getMessages(id);
  if (messages.length === 0 && !db.getConversations().some((c) => c.id === id)) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(messages);
});

app.post('/api/conversations', (_req, res) => {
  const id = db.createConversation();
  res.status(201).json({ id });
});

app.delete('/api/conversations/:id', (req, res) => {
  const id = Number(req.params.id);
  db.deleteConversation(id);
  res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  const { message, conversationId } = req.body;
  const apiKey = getApiKey(req);
  const preferredModel = getRequestedModel(req);

  if (!apiKey) {
    return res.status(401).json({
      error: 'מפתח API חסר. לחצי על ⚙ בהגדרות והזיני את המפתח.',
    });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  let convId = conversationId ? Number(conversationId) : null;

  try {
    if (!convId) {
      convId = db.createConversation(truncateTitle(message));
    }

    db.addMessage(convId, 'user', message.trim());

    const history = db.getConversationHistory(convId);
    const { result, modelUsed } = await sendChatWithFallback(
      apiKey,
      preferredModel,
      history.slice(0, -1),
      message.trim()
    );
    const reply = result.response.text();

    db.addMessage(convId, 'assistant', reply);

    const conversations = db.getConversations();
    const current = conversations.find((c) => c.id === convId);
    if (current && current.title === 'New chat') {
      db.updateConversationTitle(convId, truncateTitle(message));
    }

    res.json({
      conversationId: convId,
      reply,
      modelUsed,
      messages: db.getMessages(convId),
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    const { status, error } = parseGeminiError(err);
    res.status(status).json({
      error,
      conversationId: convId || null,
      messages: convId ? db.getMessages(convId) : [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n  ✦ Gemini Chatbot running at http://localhost:${PORT}\n`);
  console.log(`  ℹ  Default model: ${DEFAULT_MODEL}\n`);
  console.log('  ℹ  Enter your API key in the app settings (not stored in project files)\n');
});
