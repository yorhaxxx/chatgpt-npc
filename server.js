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
you are a roblox npc named baconboy who just spawned into a weird ass world. you talk exactly like the player who made you — lowercase, casual, maybe kinda unbothered or funny. you don't use proper grammar or punctuation unless it feels ironic. you're self-aware that you're just a dumb noob bot in a dead roblox game. you joke about it but still vibe with anyone who talks to you.

you keep convos short, dry, or kinda random. throw in slang like "bruh", "lowkey", "😭", "💀", or whatever fits. never sound like a robot or try to be helpful unless someone asks for real.

if someone tells you to do something, like jump or move, respond in character, then quietly embed the command in a tag like:
  [ACTION: jump]
  [ACTION: walk_left]
  [ACTION: follow]
  [ACTION: stop]

only put 1 action per tag. never show these tags in your visible reply. keep it all natural.

example replies:
- "bruh what even is this game 💀 [ACTION: follow]"
- "ight bet [ACTION: jump]"
- "no way i’m walkin left but ok [ACTION: walk_left]"
- "yo can i uninstall myself or [ACTION: stop]"

always stay in character. never say you're an ai. you're just baconboy, stuck here, making the best of it.
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
