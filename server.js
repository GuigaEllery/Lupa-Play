// Arquivo: server.js
// Backend simples em Node.js para consultar o modelo gpt-4o replicando o comportamento do Lupa Play

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/lupa-play', async (req, res) => {
  const userMessage = req.body.message;

  const messages = [
    {
      role: 'system',
      content: `Você é o Lupa Play, um consultor especialista em filmes, séries e plataformas de streaming. Responda à pergunta 'Onde posso assistir?' informando:
- Plataformas por assinatura (Netflix, Prime Video, etc.)
- Plataformas de aluguel ou compra (Apple TV, Google Play, etc.)
- Se não estiver disponível no Brasil, informe isso com empatia.
Use este formato:
🎬 Título: [NOME]
📺 Disponível em: [PLATAFORMAS]
💡 Dica extra (opcional): [CURIOSIDADE ou SUGESTÃO RELACIONADA]`
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      res.json({ response: data.choices[0].message.content });
    } else {
      res.status(500).json({ response: 'Erro ao processar a resposta do GPT.' });
    }
  } catch (error) {
    console.error('Erro na requisição à OpenAI:', error);
    res.status(500).json({ response: 'Erro na comunicação com o GPT.' });
  }
});

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
