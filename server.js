require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/gpt', async (req, res) => {
  const { messages, temperature = 0.5, model = 'gpt-4o-mini', max_tokens = 1000 } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'missing or invalid "messages" array in body' });
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
    });

    const content = response.choices[0].message.content;
    res.json({ raw: content });
  } catch (err) {
    console.error('GPT ERROR:', err);
    res.status(500).json({ error: 'gpt failed', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('universal GPT proxy is running');
});

app.listen(3000, () => console.log('GPT proxy listening on port 3000'));
