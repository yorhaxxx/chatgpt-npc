// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
});
const openai = new OpenAIApi(configuration);

app.post('/generate-planet', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Generate a description for the planet
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Describe a unique planet: ${prompt}`,
      max_tokens: 100,
    });

    const description = completion.data.choices[0].text.trim();

    // Generate an image for the planet
    const imageResponse = await openai.createImage({
      prompt: description,
      n: 1,
      size: '512x512',
    });

    const imageUrl = imageResponse.data.data[0].url;

    res.json({
      name: prompt,
      description,
      imageUrl,
    });
  } catch (error) {
    console.error('Error generating planet:', error);
    res.status(500).json({ error: 'Failed to generate planet.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
