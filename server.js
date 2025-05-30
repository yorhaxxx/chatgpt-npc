import express from "express"
import cors from "cors"
import { OpenAI } from "openai"

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

		// ask GPT for planet data
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
		console.log("[PlanetGen] GPT raw:", raw)

		let parsed = {}
		try {
			parsed = JSON.parse(raw)
		} catch (e) {
			console.warn("[PlanetGen] Failed to parse GPT response:", raw)
			return res.status(500).json({ error: "GPT failed to return valid JSON." })
		}

		if (!parsed.name || !parsed.description) {
			console.warn("[PlanetGen] Missing fields:", parsed)
			return res.status(500).json({ error: "Incomplete planet data." })
		}

		console.log("[PlanetGen] Description:", parsed.description)

		// call DALL·E for image generation
		const image = await openai.images.generate({
			model: "dall-e-3",
			prompt: parsed.description,
			n: 1,
			size: "1024x1024",
			response_format: "url"
		})

		const imageUrl = image.data[0].url
		console.log("[PlanetGen] DALL·E URL:", imageUrl)

		res.json({
			name: parsed.name,
			description: parsed.description,
			image_url: imageUrl
		})
	} catch (err) {
		console.error("[PlanetGen] SERVER ERROR:", err)
		res.status(500).json({ error: "Planet generation failed." })
	}
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log(`🪐 PlanetGen server running on port ${PORT}`)
})
