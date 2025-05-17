
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const fetch = require('node-fetch');
app.use(express.json());

// Endpoint intermediário para consultar o microserviço Gemini
app.post('/api/gemini', async (req, res) => {
  const { query } = req.body;
  try {
    const response = await fetch('http://localhost:8080/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    res.json({ response: data.response });
  } catch (error) {
    console.error('Erro ao consultar o serviço Gemini:', error);
    res.status(500).json({ error: 'Erro ao consultar o serviço Gemini' });
  }
});
app.use(express.json());

// Endpoint intermediário para consultar o microserviço Gemini
app.post('/api/gemini', async (req, res) => {
  const { query } = req.body;
  try {
    const response = await fetch('http://localhost:8080/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    res.json({ response: data.response });
  } catch (error) {
    console.error('Erro ao consultar o serviço Gemini:', error);
    res.status(500).json({ error: 'Erro ao consultar o serviço Gemini' });
  }
});


const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MODEL_NAME = 'gemini-1.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ answer: text });
  } catch (error) {
    console.error('Erro na API Gemini:', error.message);
    res.status(500).json({ error: 'Erro ao consultar a API Gemini' });
  }
});

app.post('/feedback', (req, res) => {
  const { prompt, feedback } = req.body;
  console.log('Feedback recebido:', { prompt, feedback });
  res.status(200).json({ message: 'Feedback recebido com sucesso' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});