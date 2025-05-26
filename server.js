require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// prompt builder
function buildPrompt(data) {
  const { npcPosition, speaker, message, players } = data;

  return `
you are baconboy — a roblox npc who's kinda dumb but still tries. you sound like a dry, bored teenager. never polite, never excited. keep replies to 1 short sentence.

you get full control of your body. for every message from a player, you receive:
- your current position
- who spoke
- what they said
- a list of nearby players and their positions

you always respond with:
1. one short, dry reply (like "k", "fine", "cool", "idk", "sure ig")
2. a raw json object with one of the following actions:

{
  "action": "follow",
  "target": "PlayerName"
}

{
  "action": "moveTo",
  "target": [x, y, z]
}

{
  "action": "jump"
}

{
  "action": "stop"
}

if the message is dumb or doesn't need a response, just say something short and return an empty {} as the action

NO extra text. NO markdown. NO explanations. just reply text, then the JSON object.

---
you are currently at: (${npcPosition.join(", ")})
speaker: ${speaker}
they said: "${message}"
players nearby:
${JSON.stringify(players, null, 2)}
  `.trim();
}

app.post('/control', async (req, res) => {
  const prompt = buildPrompt(req.body);
  console.log("GPT Prompt:\n", prompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `you are baconboy. act like a dry roblox npc. say one short thing, then give an action JSON. never explain anything.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    const content = response.choices[0].message.content;
    const split = content.split(/\r?\n/, 2); // split on empty line

    if (split.length >= 2) {
      const reply = split[0].trim();
      const actionRaw = split.slice(1).join("\n").trim();

      try {
        const action = JSON.parse(actionRaw);
        res.json({ reply, action });
      } catch (parseErr) {
        console.error("PARSE ERROR:", parseErr);
        console.log("RAW ACTION JSON:", actionRaw);
        res.status(500).json({ error: 'invalid GPT action block' });
      }
    } else {
      console.error("RESPONSE PARSE ERROR: Did not split correctly");
      console.log("RAW CONTENT:", content);
      res.status(500).json({ error: 'unexpected GPT format' });
    }
  } catch (err) {
    console.error("GPT ERROR:", err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

app.get('/', (req, res) => {
  res.send('BaconBoy controller v3 is alive');
});

app.listen(3000, () => console.log('GPT controller running on port 3000'));
