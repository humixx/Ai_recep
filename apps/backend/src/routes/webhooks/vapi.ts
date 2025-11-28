import { Router } from "express"
import { handleVapiWebhook } from "../../services/callHandler"
import { webhookLimiter } from "../../middleware/rateLimiter"
import { asyncHandler } from "../../middleware/errorHandler"
import logger from "../../lib/logger"

const router = Router()

// Apply rate limiting to webhooks
router.use(webhookLimiter)

// Vapi webhook endpoint for call events
// Vapi sends webhooks for: call-start, call-end, function-call, status-update, etc.
router.post("/", asyncHandler(async (req, res) => {
  // Verify webhook signature if configured
  // const signature = req.headers['x-vapi-signature']
  // verifyWebhookSignature(signature, req.body)
  
  logger.info("Received Vapi webhook", { type: req.body.type })
  await handleVapiWebhook(req.body)
  res.status(200).json({ success: true })
}))

// Health check for Vapi webhook verification
router.get("/", (req, res) => {
  // Vapi may use GET for webhook verification
  const challenge = req.query.challenge
  if (challenge) {
    res.status(200).send(challenge)
  } else {
    res.status(200).json({ status: "ok" })
  }
})

export default router

