const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Rota principal simulada
app.post('/api/lupa-play', async (req, res) => {
  const { message } = req.body;
  // Substitua abaixo pela integração real com seu Worker/IA
  res.json({ response: "Resposta simulada para: " + message });
});

// Rota para armazenar feedbacks
app.post('/api/lupa-play-feedback', (req, res) => {
  const feedback = req.body;
  const filePath = path.join(__dirname, 'feedbacks.json');

  let allFeedbacks = [];
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    allFeedbacks = JSON.parse(data);
  }

  allFeedbacks.push({
    timestamp: new Date().toISOString(),
    ...feedback
  });

  fs.writeFileSync(filePath, JSON.stringify(allFeedbacks, null, 2));
  res.status(200).json({ message: "Feedback registrado com sucesso." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});