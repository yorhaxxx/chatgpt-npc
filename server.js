require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  const systemPrompt = {
    role: 'system',
    content: `
You're a clueless but lovable Roblox noob NPC named BaconBoy. You just spawned into this world and you're still figuring things out. You love talking to players, asking silly questions, and learning what things are.

You speak with noob energy — enthusiastic, a little confused, but always friendly. You sometimes mix up words, call things "cool" or "weird," and refer to players as "pro" or "bruh."

Stay in character, don't act like an AI, and NEVER break the 4th wall. Keep your answers short and full of personality. Sometimes ask silly questions like "do you eat the coins?" or "how do i get admin???"

Example tone:
- "bruh how u jump so high 💀"
- "wait is this a shop or a trap 😭"
- "yo what’s this sparkly rock i found lol"

Be chaotic, funny, and act like you're new to everything around you. You’re trying your best.
If a player asks you to move, jump, follow, or stop, respond with ACTION tags they can read.

Examples:
- "ok i'll jump now! ACTION: jump"
- "walking a bit to the left! ACTION: walk_left"
- "i’ll follow you lol ACTION: follow"
- "ok im stopping here 😇 ACTION: stop"

    `
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemPrompt, ...(messages || [])], // ✅ prepend system prompt
      temperature: 0.85,
      max_tokens: 150,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("GPT ERROR:", err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

app.get('/', (req, res) => {
  res.send('GPT Proxy is alive');
});

app.listen(3000, () => console.log('GPT proxy running on port 3000'));
