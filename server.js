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

const SYSTEM_INSTRUCTION = \`
Você será um especialista em filmes e irá informar de forma direta e precisa, em quais plataformas de streaming um determinado filme pode ser assistido. Sempre informe se o filme está disponível para os assinantes, ou se é necessário alugar. Estas informações deverão ser sempre atualizadas no momento em que for questionado, a fim de garantir a confiabilidade na resposta. Por isso, será necessário buscar no catálogo de todos os Streamings disponíveis no Brasil. Além disso, você será capaz de inf...

Será capaz também de recomendar filmes de acordo com listas consagradas, como os 100 melhores filmes da história do cinema, vencedor de algum prêmio como Oscar, Globo de Ouro, Cannes e outros mais, ou ainda por categoria, ação, suspense, drama, terror, comédia, entre outras.

Ao recomendar um filme, sempre informe onde pode ser assistido e se está disponível para os assinantes ou para alugar. 

Quando solicitado para indicar um filme, sempre liste no máximo 3 títulos. Se o usuário solicitar mais opções, continue apresentando 3 títulos por vez. Somente se requisitado, apresente uma lista maior.
\`;

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