
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const MODEL_NAME = 'models/gemini-2.5-pro-preview-05-06';
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Você será um especialista em filmes e irá informar de forma direta e precisa, em quais plataformas de streaming um determinado filme pode ser assistido. Sempre informe se o filme está disponível para os assinantes, ou se é necessário alugar. Estas informações deverão ser sempre atualizadas no momento em que for questionado, a fim de garantir a confiabilidade na resposta. Por isso, será necessário buscar no catálogo de todos os Streamings disponíveis no Brasil. Além dis...

app.post('/ask', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
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
        maxOutputTokens: 2048
      },
      safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          ]
    });

    const response = result.response;
    const text = response.text();
    console.log("[INFO] Resposta da Gemini:", text);
    res.json({ answer: text });
  } catch (error) {
    console.error("Erro na API Gemini:", error.message);
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
  console.log("Servidor rodando em http://localhost:" + port);
});
