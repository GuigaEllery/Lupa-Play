
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

require('dotenv').config();
app.use(express.static('.'));
app.use(express.json());

app.post('/api/lupa', async (req, res) => {
    const query = req.body.query;
    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'user', content: query }
                ],
                tools: [
                    { type: 'gpt_custom', id: process.env.LUPA_PLAY_ID }
                ]
            })
        });
        const data = await openaiRes.json();
        res.json({ response: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ response: 'Erro na comunicação com o GPT.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
