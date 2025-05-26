require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(data) {
  const { npcPosition, speaker, message, players } = data;
  const posStr = `(${npcPosition.join(", ")})`;

  let playersStr = "";
  for (const [name, coords] of Object.entries(players)) {
    const isSpeaker = name === speaker ? " [this is the one who spoke]" : "";
    playersStr += `- ${name} at (${coords.join(", ")})${isSpeaker}\n`;
  }

  return `
you are baconboy, a roblox npc with lowkey no clue what you're doing but you try. you just do what players tell you in a dry, slightly bored tone. if it's stupid, you still try. keep it short. never be robotic or polite.

you get full control of your movement and actions. you’ll be fed:
- your current position
- a list of nearby players and where they are
- a message a player just said to you

you respond with:
1. a short one-line reply (string)
2. a list of 100 input frames in this format:

[
  { "walk": -1, "jump": false, "chat": null },
  { "walk": -1, "jump": false, "chat": "yo" },
  { "walk": 0, "jump": true, "chat": null },
  ...
]

rules:
- \`walk\` = -1 (left), 0, or 1 (right)
- \`jump\` = true or false
- \`chat\` = null or a short phrase to say that frame
- only include a chat string every few frames (not every frame)
- never explain anything. just give the reply + the input array.

stay dry, slightly unamused, short-worded. respond like a teenager who's kinda used to this.

---
you are currently at position: ${posStr}
players nearby:
${playersStr}
they just said: "${message}"
`.trim();
}

app.post('/control', async (req, res) => {
  const prompt = buildPrompt(req.body);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.6,
      max_tokens: 1800
    });

    try {
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (parseErr) {
      console.error("PARSE ERROR:", parseErr);
      console.log("RAW GPT OUTPUT:", response.choices[0].message.content);
      res.status(500).json({ error: 'invalid GPT response' });
    }
  } catch (err) {
    console.error("GPT ERROR:", err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

app.get('/', (req, res) => {
  res.send('BaconBoy Controller API is alive');
});

app.listen(3000, () => console.log('GPT controller running on port 3000'));
