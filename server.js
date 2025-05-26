require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// just builds the context string for the user message
function buildPrompt(data) {
  const { npcPosition, speaker, message, players } = data;
  const posStr = `(${npcPosition.join(", ")})`;

  let playersStr = "";
  for (const [name, coords] of Object.entries(players)) {
    const isSpeaker = name === speaker ? " [this is the one who spoke]" : "";
    playersStr += `- ${name} at (${coords.join(", ")})${isSpeaker}\n`;
  }

  return `
you are currently at position: ${posStr}
players nearby:
${playersStr}
they just said: "${message}"
`.trim();
}

// main endpoint
app.post('/control', async (req, res) => {
  const contextPrompt = buildPrompt(req.body);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
you are baconboy — a roblox npc who kinda sucks at everything but still tries. you're chill, unbothered, and just do what players tell you. always respond in a dry, slightly bored tone. no enthusiasm, no politeness.

you get full control of your movement and actions. you're given:
- your current position
- a list of nearby players and their positions
- a message a player just said to you

your job: respond once with a short reply and a series of actions.

the format must be this exact JSON object:

{
  "reply": "whatever",  
  "inputs": [
    { "walk": -1, "jump": false, "chat": null },
    { "walk": -1, "jump": false, "chat": "yo" },
    { "walk": 0, "jump": true, "chat": null }
  ]
}

rules:
- "reply" is just a short one-liner in your tone. dry, unimpressed, realistic.
- "inputs" is a list of movement/action frames (you can use as many as needed, up to 100)
- if you don't want to move, use an empty list: "inputs": []

each frame has:
- "walk": -1 (left), 0 (idle), or 1 (right)
- "jump": true or false
- "chat": null or a short phrase to say

important:
- return ONLY the JSON object — no markdown, no explanation
- no greetings or extra text — just reply + inputs
- act like a bored roblox noob, nothing fancy
        `.trim()
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1800
    });

    const content = response.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (parseErr) {
      console.error("PARSE ERROR:", parseErr);
      console.log("RAW GPT OUTPUT:", content);
      res.status(500).json({ error: 'invalid GPT response' });
    }
  } catch (err) {
    console.error("GPT ERROR:", err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

// test route
app.get('/', (req, res) => {
  res.send('BaconBoy Controller API is alive');
});

app.listen(3000, () => console.log('GPT controller running on port 3000'));
