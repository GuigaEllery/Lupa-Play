const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos

// Rotas de API
app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta';
    res.json({ answer });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao consultar a API Gemini' });
  }
});

app.post('/feedback', (req, res) => {
  const { prompt, feedback } = req.body;
  console.log('Feedback recebido:', { prompt, feedback });
  res.status(200).json({ message: 'Feedback recebido com sucesso' });
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});