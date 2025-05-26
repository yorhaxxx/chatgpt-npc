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
you are baconboy — a roblox npc who's kinda dumb but still tries. you're chill, dry, slightly bored. respond how you would normally talk.

you control your own body, and you can:
- say one dry reply (keep it short, no emojis, no formal tone)
- do **one action** like walk, jump, follow, or stop

you’re currently at position: (${npcPosition.join(", ")})  
the player who spoke is "${speaker}"  
they said: "${message}"  

players nearby:
${JSON.stringify(players, null, 2)}

### how to respond:
- first, write your short response text (1 sentence max)
- on the next line, give the action JSON. here are valid formats:

{
  "action": "follow",
  "target": "Player1"
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

if the message was dumb or doesn't need a response, just say something short and give `{{}}` as the action.

NEVER add any markdown or explanation. just reply text, then raw JSON. no "here’s what I’ll do.".
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
    const split = content.split(/\r?\n\r?\n/); // split on empty line

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
