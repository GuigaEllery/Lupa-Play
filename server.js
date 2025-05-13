
// Arquivo: server.js
// Backend que acessa diretamente um Assistente da OpenAI criado na plataforma API

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

app.post('/api/lupa-play', async (req, res) => {
  const userMessage = req.body.message;

  if (!OPENAI_API_KEY || !ASSISTANT_ID) {
    return res.status(500).json({ response: 'Variáveis de ambiente não configuradas corretamente.' });
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    };

    // Criar nova thread
    const threadRes = await fetch('https://api.openai.com/v2/threads', {
      method: 'POST',
      headers
    });
    const thread = await threadRes.json();
    const threadId = thread.id;

    // Adicionar mensagem à thread
    await fetch(`https://api.openai.com/v2/threads/${threadId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        role: 'user',
        content: userMessage
      })
    });

    // Executar o assistente
    const runRes = await fetch(`https://api.openai.com/v2/threads/${threadId}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    });
    const run = await runRes.json();

    // Polling com timeout máximo de 20 segundos
    let status = 'in_progress';
    let attempts = 0;
    const maxAttempts = 20;

    while (status === 'in_progress' || status === 'queued') {
      if (attempts >= maxAttempts) {
        return res.status(504).json({ response: 'Tempo limite excedido. Tente novamente em instantes.' });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusRes = await fetch(`https://api.openai.com/v2/threads/${threadId}/runs/${run.id}`, {
        headers
      });
      const runStatus = await statusRes.json();
      status = runStatus.status;
      attempts++;

      if (status === 'failed' || status === 'cancelled') {
        return res.status(500).json({ response: `A execução falhou com status: ${status}.` });
      }
    }

    // Buscar a resposta
    const msgRes = await fetch(`https://api.openai.com/v2/threads/${threadId}/messages`, {
      headers
    });
    const msgData = await msgRes.json();
    const messages = msgData.data || [];

    const lastAssistantMessage = messages.reverse().find(m => m.role === 'assistant');

    if (lastAssistantMessage && lastAssistantMessage.content && lastAssistantMessage.content.length > 0) {
      const reply = lastAssistantMessage.content.map(c => c.text?.value || '').join('\n').trim();
      return res.json({ response: reply || 'Sem conteúdo textual retornado pelo assistente.' });
    } else {
      console.warn('Mensagem do assistente não encontrada ou sem conteúdo. Resposta bruta:', JSON.stringify(messages, null, 2));
      return res.status(500).json({ response: 'O assistente não retornou nenhuma resposta interpretável.' });
    }
  } catch (error) {
    console.error('Erro na comunicação com o assistente:', error);
    res.status(500).json({ response: 'Erro na comunicação com o assistente.' });
  }
});

// Redirecionamento raiz para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
