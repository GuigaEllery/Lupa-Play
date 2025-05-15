
// Arquivo: server.js (ajustado para acessar "/" do Worker)

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/lupa-play', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch('https://lupa-play-worker.ellery-guilherme.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // x-api-key: process.env.LUPA_PLAY_API_KEY (adicione aqui no futuro, se desejar proteger)
      },
      body: JSON.stringify({ prompt: userMessage })
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const texto = await response.text();
      return res.status(502).json({ response: 'Resposta inesperada do Lupa Play: ' + texto.slice(0, 100) });
    }

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
