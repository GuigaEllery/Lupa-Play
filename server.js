/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;
const MODEL_NAME = 'gemini-2.5-pro-preview-05-06';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ────────────────────────────────────────────────────────────────────────────────
// Middlewares
// ────────────────────────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' })); // sane limit
app.use(express.static(path.join(__dirname, 'public')));

// ────────────────────────────────────────────────────────────────────────────────
// Health‑check endpoint (Render pings /healthz by default, but we'll be explicit)
// ────────────────────────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.send('ok'));

// ────────────────────────────────────────────────────────────────────────────────
// System instruction – keep short in‑line to avoid “Unexpected end of input”.
// If you need a longer prompt, load from a separate .txt file with fs.readFileSync
// ────────────────────────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `
Você é um especialista em cinema. Diga, de forma direta e atualizada,
onde o usuário pode assistir ao filme (inclua preço/aluguel se aplicável),
e liste até três recomendações alinhadas ao briefing do usuário.`;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function buildError(status, message, details = {}) {
  return { status, timestamp: Date.now(), message, ...details };
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.post('/ask', async (req, res) => {
  const prompt =
    (req.body && (req.body.prompt || req.body.message || req.body.text || '')) ||
    '';

  if (!prompt.trim()) {
    console.warn('[WARN] Prompt vazio recebido');
    return res.status(400).json(buildError(400, 'Prompt vazio'));
  }

  if (!GEMINI_API_KEY) {
    console.error('[FATAL] Variável de ambiente GEMINI_API_KEY ausente');
    return res
      .status(500)
      .json(buildError(500, 'Servidor mal configurado – contate o administrador'));
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      tools: [
        {
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        },
      ],
    });

    const text = result?.response?.text?.() ?? '';
    console.info('[INFO] Gemini retornou %d caracteres', text.length);
    return res.json({ answer: text });
  } catch (err) {
    // Erros que vêm da lib costumam ter .status ou .code – log detalhado
    console.error('[ERROR] Falha na Gemini API:', err);
    return res
      .status(502)
      .json(buildError(502, 'Falha ao processar sua solicitação', { reason: err.message }));
  }
});

app.post('/feedback', (req, res) => {
  const { prompt, feedback } = req.body || {};
  console.info('[INFO] Feedback recebido', { prompt, feedback });
  res.json({ message: 'Feedback recebido com sucesso' });
});

// Envie index.html para qualquer rota não‑API
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')),
);

// ────────────────────────────────────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀 Lupa Play backend operando em http://localhost:${PORT}`),
);
