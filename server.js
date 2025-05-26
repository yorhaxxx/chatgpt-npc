import express from "express"
import cors from "cors"
import { OpenAI } from "openai"
import axios from "axios"

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.post("/generate-planet", async (req, res) => {
  try {
    const { prompt } = req.body
    console.log("[PlanetGen] Prompt received:", prompt)

    // Step 1: generate a planet description from GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Describe a beautiful and imaginative planet. Your answer will be used to generate an image."
        },
        {
          role: "user",
          content: prompt || "make me a planet"
        }
      ],
      temperature: 0.8
    })

    const description = completion.choices[0].message.content.trim()
    console.log("[PlanetGen] GPT description:", description)

    // Step 2: generate an image using that description
    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    })

    const imageUrl = image.data[0].url
    res.json({
      name: prompt,
      description,
      imageUrl
    })
  } catch (err) {
    console.error("[PlanetGen] Failed:", err.message || err)
    res.status(500).json({ error: "Planet generation failed." })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🪐 PlanetGen server running on port ${PORT}`)
})
