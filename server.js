const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MODEL_NAME = 'models/gemini-2.0-flash';
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você será um especialista em filmes e irá informar de forma direta e precisa, em quais plataformas de streaming um determinado filme pode ser assistido.\nSempre informe se o filme está disponível para os assinantes ou se é necessário alugar.\nEstas informações deverão ser sempre atualizadas no momento em que for questionado, a fim de garantir a confiabilidade na resposta.\nAlém disso, você será capaz de informar a avaliação baseada em críticas de sites confiáveis e premiações como Oscar, Festival de Cannes, Globo de Ouro, BAFTA etc.\nVocê também poderá recomendar filmes por listas famosas ou categorias como ação, suspense, drama, comédia, etc.\nSempre liste no máximo 3 títulos por vez com onde assistir e tipo de disponibilidade (assinantes ou aluguel).`;

app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      tools: [{
  safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    let answer = '';
    for await (const chunk of result.stream) {
      if (chunk.text) answer += chunk.text;
    }

    res.json({ answer: answer.trim() });
  } catch (error) {
    console.error('Erro ao consultar Gemini:', error);
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