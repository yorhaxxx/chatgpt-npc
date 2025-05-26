import express from "express"
import cors from "cors"
import { OpenAI } from "openai"
import axios from "axios"
import fs from "fs"
import path from "path"

const app = express()
app.use(cors())
app.use(express.json())
app.use("/temp", express.static("temp"))

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post("/planet", async (req, res) => {
	try {
		const userMsg = req.body.user_message?.slice(0, 200) || "make me a planet"
		
		// Step 1: Ask GPT for a DALL·E-friendly description
		const chat = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You're a visual planet designer. For any message, return a single visual prompt usable by DALL·E to generate a spherical planet texture. Be literal, visual, and short.`
				},
				{
					role: "user",
					content: userMsg
				}
			],
			temperature: 0.7
		})

		const prompt = chat.choices[0].message.content.trim()

		// Step 2: Use DALL·E to generate image
		const img = await openai.images.generate({
			model: "dall-e-3",
			prompt,
			n: 1,
			size: "1024x1024",
			response_format: "url"
		})

		const imageUrl = img.data[0].url

		// Step 3: Download and host locally
		const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
		const id = Date.now()
		const filename = `planet_${id}.png`
		const filepath = path.join("temp", filename)
		fs.writeFileSync(filepath, response.data)

		const hostedUrl = `${req.protocol}://${req.get("host")}/temp/${filename}`

		// you can later upload this to Roblox manually and return assetId
		res.json({
			prompt,
			image_url: hostedUrl,
			rbx_asset_id: null // placeholder if you add auto-upload
		})
	} catch (err) {
		console.error("[/planet] Error:", err)
		res.status(500).json({ error: "Something went wrong." })
	}
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("🪐 Planet server live on port " + PORT))
