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

app.post("/planet", async (req, res) => {
	try {
		const userPrompt = req.body.user_message?.slice(0, 200) || "make me a planet"
		console.log("[PlanetGen] Prompt received:", userPrompt)

		// 🔹 STEP 1: GPT creates name + visual description
		const gpt = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You are a planet generator. Respond ONLY with a JSON object like:
{
  "name": "Luminara",
  "description": "A glowing planet covered in crystal spires and bioluminescent forests."
}`
				},
				{ role: "user", content: userPrompt }
			],
			temperature: 0.8
		})

		const raw = gpt.choices[0].message.content.trim()
		let parsed = {}

		try {
			parsed = JSON.parse(raw)
		} catch (e) {
			console.warn("[PlanetGen] Failed to parse GPT response:", raw)
			return res.status(500).json({ error: "GPT failed to respond with JSON." })
		}

		if (!parsed.name || !parsed.description) {
			return res.status(500).json({ error: "Incomplete planet data from GPT." })
		}

		// 🔹 STEP 2: DALL·E creates image from description
		const image = await openai.images.generate({
			model: "dall-e-3",
			prompt: parsed.description,
			n: 1,
			size: "1024x1024",
			response_format: "url"
		})

		const imageUrl = image.data[0].url

		res.json({
			name: parsed.name,
			description: parsed.description,
			image_url: imageUrl
		})
	} catch (err) {
		console.error("[/planet] Error:", err.message || err)
		res.status(500).json({ error: "Planet generation failed." })
	}
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log("🪐 PlanetGen server running on port", PORT)
})
