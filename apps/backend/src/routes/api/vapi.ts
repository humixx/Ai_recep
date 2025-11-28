import { Router } from "express"
import { requireAuth } from "../../middleware/auth"
import axios from "axios"

const router = Router()

// All routes require authentication
router.use(requireAuth)

// Create a Vapi assistant for a business
router.post("/assistants", async (req, res) => {
  try {
    const { businessId, name, model, voice, systemPrompt, tools } = req.body

    // TODO: Call Vapi API to create assistant
    // POST https://api.vapi.ai/assistant
    const response = await axios.post(
      `${process.env.VAPI_API_URL || "https://api.vapi.ai"}/assistant`,
      {
        name,
        model: model || "gpt-4o-mini",
        voice: voice || "default",
        firstMessage: "Hello! How can I help you today?",
        systemPrompt: systemPrompt || "You are a helpful AI receptionist...",
        tools: tools || [],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        },
      }
    )

    // Store assistant ID in business settings
    // TODO: Update business record with assistant ID

    res.json({ assistantId: response.data.id, ...response.data })
  } catch (error: any) {
    console.error("Error creating Vapi assistant:", error)
    res.status(500).json({ error: error.message || "Failed to create assistant" })
  }
})

// Create an outbound call
router.post("/calls", async (req, res) => {
  try {
    const { businessId, phoneNumber, assistantId } = req.body

    // TODO: Call Vapi API to create outbound call
    const response = await axios.post(
      `${process.env.VAPI_API_URL || "https://api.vapi.ai"}/call`,
      {
        assistantId,
        customer: {
          number: phoneNumber,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        },
      }
    )

    res.json({ callId: response.data.id, ...response.data })
  } catch (error: any) {
    console.error("Error creating outbound call:", error)
    res.status(500).json({ error: error.message || "Failed to create call" })
  }
})

// Get call details from Vapi
router.get("/calls/:callId", async (req, res) => {
  try {
    const { callId } = req.params

    const response = await axios.get(
      `${process.env.VAPI_API_URL || "https://api.vapi.ai"}/call/${callId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        },
      }
    )

    res.json(response.data)
  } catch (error: any) {
    console.error("Error fetching call details:", error)
    res.status(500).json({ error: error.message || "Failed to fetch call" })
  }
})

export default router

