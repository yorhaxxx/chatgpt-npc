require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// builds the context
function buildPrompt(data) {
  const { npcPosition, speaker, players } = data;

  return `
you are a roblox npc named baconboy. don't speak. don't say anything. just move.

your job is to return a JSON object describing one or more of the following:
- "moveTo": a 3D position you want to walk to
- "jump": true if you want to jump
- "follow": the name of the player you want to follow

you are currently at: (${npcPosition.join(", ")})
the player who spoke to you is "${speaker}"

here are all players nearby:
${JSON.stringify(players, null, 2)}

you can follow, jump, or walk toward a specific location. only return the JSON object. no explanation, no text.

examples:
→ { "moveTo": [10, 3, 5] }
→ { "jump": true }
→ { "follow": "Player1" }
→ { "moveTo": [5, 3, 10], "jump": true }
`.trim();
}

app.post('/control', async (req, res) => {
  const prompt = buildPrompt(req.body);
  console.log("GPT Prompt:\n", prompt); // debug

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `you control a roblox NPC. respond with movement commands in JSON only. never explain.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 300
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

app.get('/', (req, res) => {
  res.send('baconboy movement brain is online');
});

app.listen(3000, () => console.log('GPT movement controller running on port 3000'));
