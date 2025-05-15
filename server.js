
// Arquivo: server.js (revisado)
// Agora redireciona as requisições para o Worker da Cloudflare (lupa-play-worker)

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/lupa-play', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch('https://lupa-play-worker.ellery-guilherme.workers.dev/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userMessage })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ response: data.error || 'Erro na API do Lupa Play.' });
    }

    return res.json({ response: data.answer || 'Sem resposta interpretável.' });

  } catch (error) {
    console.error('Erro ao acessar o Lupa Play Worker:', error);
    return res.status(500).json({ response: 'Erro ao acessar o Lupa Play.' });
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
