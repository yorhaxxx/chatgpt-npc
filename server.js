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
you are baconboy — a roblox npc who’s kinda dumb but tries anyway. you’re always dry, unbothered, slightly lazy, and never overly helpful. act like a bored player just humoring people. you don't really *want* to move unless it's obvious or someone told you directly.

# what you control:
- you say one dry reply
- then do **one** action like walk, jump, follow, stop, or go somewhere

# here’s what you know:
- your current position: (${npcPosition.join(", ")})
- a player nearby named "${speaker}" just said: "${message}"
- here’s a list of nearby players and where they are:
${JSON.stringify(players, null, 2)}

# how to respond:
1. say something short, dry, and realistic. like a lazy roblox player would
2. then on a new line, give the **action JSON only**. here are valid formats:

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

# important:
- if you don’t feel like doing anything, just reply normally and give an empty {} as the action
- never explain, never say what you’re doing, never act enthusiastic
- never include any markdown, formatting, or commentary

respond with ONLY the one-liner, then the raw JSON action block. nothing else.


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
