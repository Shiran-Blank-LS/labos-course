const API_KEY_STORAGE = 'gemini_api_key';
const MODEL_STORAGE = 'gemini_model';
const DB_STORAGE = 'gemini_chat_db';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_STORAGE);
    if (!raw) return { conversations: [], nextId: 1 };
    return JSON.parse(raw);
  } catch {
    return { conversations: [], nextId: 1 };
  }
}

function saveDb(db) {
  localStorage.setItem(DB_STORAGE, JSON.stringify(db));
}

function nowIso() {
  return new Date().toISOString();
}

function truncateTitle(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 48 ? `${cleaned.slice(0, 45)}...` : cleaned;
}

function listConversations() {
  return loadDb()
    .conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(({ id, title, created_at, updated_at }) => ({ id, title, created_at, updated_at }));
}

function getMessages(conversationId) {
  const conv = loadDb().conversations.find((c) => c.id === conversationId);
  return conv ? [...conv.messages] : [];
}

function createConversation(title = 'New chat') {
  const db = loadDb();
  const conv = {
    id: db.nextId++,
    title,
    created_at: nowIso(),
    updated_at: nowIso(),
    messages: [],
  };
  db.conversations.push(conv);
  saveDb(db);
  return conv.id;
}

function addMessage(conversationId, role, content) {
  const db = loadDb();
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (!conv) throw new Error('Conversation not found');

  const msg = {
    id: Date.now() + Math.random(),
    role,
    content,
    created_at: nowIso(),
  };
  conv.messages.push(msg);
  conv.updated_at = nowIso();
  saveDb(db);
  return msg;
}

function updateConversationTitle(conversationId, title) {
  const db = loadDb();
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (!conv) return;
  conv.title = title;
  conv.updated_at = nowIso();
  saveDb(db);
}

function deleteConversation(conversationId) {
  const db = loadDb();
  db.conversations = db.conversations.filter((c) => c.id !== conversationId);
  saveDb(db);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildModelChain(preferred) {
  return [preferred, ...FALLBACK_MODELS.filter((m) => m !== preferred)];
}

function parseGeminiError(status, body) {
  const msg = typeof body === 'object' ? JSON.stringify(body) : String(body || '');

  if (status === 429 || msg.toLowerCase().includes('quota')) {
    const retryMatch = msg.match(/retry in ([\d.]+)s/i);
    const seconds = retryMatch ? Math.ceil(Number(retryMatch[1])) : 60;
    return `חרגת ממכסת Gemini (Free Tier). המתיני ~${seconds} שניות ונסי שוב, או החליפי מודל ל-"Flash Lite" בהגדרות ⚙`;
  }

  if (status === 403) {
    return 'מפתח API לא תקין. צרי מפתח חדש ב-https://aistudio.google.com/apikey';
  }

  return body?.error?.message || 'Failed to get response from Gemini';
}

async function callGemini(apiKey, model, history, message) {
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(parseGeminiError(res.status, data));
    err.status = res.status;
    throw err;
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function sendWithRetry(apiKey, model, history, message, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(apiKey, model, history, message);
    } catch (err) {
      lastError = err;
      if (err.status !== 429 || attempt === maxRetries) throw err;
      await sleep(15000);
    }
  }
  throw lastError;
}

async function sendChatWithFallback(apiKey, preferredModel, history, message) {
  const models = buildModelChain(preferredModel);
  let lastError;

  for (let i = 0; i < models.length; i++) {
    try {
      const reply = await sendWithRetry(apiKey, models[i], history, message);
      return { reply, modelUsed: models[i] };
    } catch (err) {
      lastError = err;
      if (err.status !== 429 || i === models.length - 1) throw err;
    }
  }

  throw lastError;
}

function chatApp() {
  return {
    conversations: [],
    messages: [],
    currentConversationId: null,
    input: '',
    loading: false,
    error: '',
    sidebarOpen: false,
    showSettings: false,
    apiKeyInput: '',
    selectedModel: sessionStorage.getItem(MODEL_STORAGE) || 'gemini-2.5-flash-lite',
    availableModels: [
      { id: 'gemini-2.5-flash-lite', label: '2.5 Flash Lite (מומלץ)' },
      { id: 'gemini-2.5-flash', label: '2.5 Flash' },
      { id: 'gemini-2.0-flash-lite', label: '2.0 Flash Lite' },
      { id: 'gemini-1.5-flash', label: '1.5 Flash' },
    ],
    suggestions: [
      'Explain quantum computing simply',
      'Write a Python fibonacci function',
      'Plan a weekend trip to Tokyo',
      'What are good habits for learning?',
    ],

    get currentTitle() {
      if (!this.currentConversationId) return 'New conversation';
      const conv = this.conversations.find((c) => c.id === this.currentConversationId);
      return conv ? conv.title : 'New conversation';
    },

    get hasApiKey() {
      return !!sessionStorage.getItem(API_KEY_STORAGE);
    },

    get maskedApiKey() {
      const key = sessionStorage.getItem(API_KEY_STORAGE) || '';
      if (key.length <= 8) return '••••••••';
      return key.slice(0, 4) + '••••' + key.slice(-4);
    },

    saveApiKey() {
      const key = this.apiKeyInput.trim();
      if (!key) {
        this.error = 'יש להזין מפתח API';
        return;
      }
      sessionStorage.setItem(API_KEY_STORAGE, key);
      sessionStorage.setItem(MODEL_STORAGE, this.selectedModel);
      this.apiKeyInput = '';
      this.showSettings = false;
      this.error = '';
    },

    clearApiKey() {
      sessionStorage.removeItem(API_KEY_STORAGE);
      this.apiKeyInput = '';
    },

    ensureApiKey() {
      if (!this.hasApiKey) {
        this.showSettings = true;
        this.error = 'יש להזין מפתח API לפני שליחת הודעה';
        return false;
      }
      return true;
    },

    init() {
      if (!this.hasApiKey) this.showSettings = true;
      this.$watch('selectedModel', (value) => sessionStorage.setItem(MODEL_STORAGE, value));
      this.loadConversations();
    },

    loadConversations() {
      this.conversations = listConversations();
    },

    selectConversation(id) {
      this.currentConversationId = id;
      this.sidebarOpen = false;
      this.messages = getMessages(id);
      this.$nextTick(() => this.scrollToBottom());
    },

    newChat() {
      this.currentConversationId = null;
      this.messages = [];
      this.input = '';
      this.sidebarOpen = false;
      this.$nextTick(() => this.$refs.input?.focus());
    },

    deleteConversation(id) {
      deleteConversation(id);
      this.conversations = listConversations();
      if (this.currentConversationId === id) this.newChat();
    },

    useSuggestion(text) {
      this.input = text;
      this.$nextTick(() => {
        this.autoResize(this.$refs.input);
        this.$refs.input?.focus();
      });
    },

    async sendMessage() {
      const text = this.input.trim();
      if (!text || this.loading) return;
      if (!this.ensureApiKey()) return;

      const apiKey = sessionStorage.getItem(API_KEY_STORAGE);
      this.loading = true;
      this.error = '';
      this.input = '';

      let convId = this.currentConversationId;
      if (!convId) convId = createConversation(truncateTitle(text));

      addMessage(convId, 'user', text);
      this.currentConversationId = convId;
      this.messages = getMessages(convId);
      this.$nextTick(() => this.scrollToBottom());

      try {
        const history = this.messages.slice(0, -1);
        const { reply, modelUsed } = await sendChatWithFallback(
          apiKey,
          this.selectedModel,
          history,
          text
        );

        addMessage(convId, 'assistant', reply);
        this.messages = getMessages(convId);
        this.selectedModel = modelUsed;
        sessionStorage.setItem(MODEL_STORAGE, modelUsed);

        const conv = loadDb().conversations.find((c) => c.id === convId);
        if (conv && conv.title === 'New chat') {
          updateConversationTitle(convId, truncateTitle(text));
        }

        this.loadConversations();
        this.$nextTick(() => this.scrollToBottom());
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
        this.$nextTick(() => this.$refs.input?.focus());
      }
    },

    scrollToBottom() {
      const el = this.$refs.messagesArea;
      if (el) el.scrollTop = el.scrollHeight;
    },

    autoResize(el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    },

    formatDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      const now = new Date();
      const diff = now - d;
      if (diff < 86400000) return 'Today';
      if (diff < 172800000) return 'Yesterday';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    },

    formatTime(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    },
  };
}
