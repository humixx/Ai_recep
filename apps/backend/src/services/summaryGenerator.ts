import { PrismaClient } from "@prisma/client"
import OpenAI from "openai"
import logger from "../lib/logger"
import { sendNotification } from "./notificationService"

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface CallSummary {
  intent: string
  details: Record<string, any>
  action: "callback" | "booking" | "quote" | "info"
}

/**
 * Generate call summary using OpenAI
 */
export async function generateCallSummary(
  transcript: string,
  businessId: string
): Promise<CallSummary> {
  // Get business context
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  })

  if (!business) {
    throw new Error(`Business not found: ${businessId}`)
  }

  const systemPrompt = `You are an AI assistant that summarizes phone call transcripts for a ${business.businessType || "business"} called "${business.name}".

Extract key information from the conversation and create a structured summary.

Return a JSON object with:
- intent: The main purpose of the call (e.g., "book appointment", "inquire about services", "cancel booking")
- details: Object containing extracted information (customer name, phone, requested service, preferred time, etc.)
- action: One of: "callback" (needs follow-up), "booking" (appointment made), "quote" (needs pricing), "info" (information only)

Be concise but include all important details.`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summarize this call transcript:\n\n${transcript}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    })

    const summaryText = response.choices[0]?.message?.content
    if (!summaryText) {
      throw new Error("No summary generated")
    }

    const summary: CallSummary = JSON.parse(summaryText)
    return summary
  } catch (error) {
    logger.error("Error generating call summary:", error)
    // Return fallback summary
    return {
      intent: "unknown",
      details: {},
      action: "callback",
    }
  }
}

/**
 * Generate and save summary to database
 */
export async function generateAndSaveSummary(
  callId: string,
  transcript: string,
  businessId: string
): Promise<void> {
  try {
    const summary = await generateCallSummary(transcript, businessId)

    // Update call with summary
    await prisma.call.update({
      where: { id: callId },
      data: {
        summary: summary as any,
      },
    })

    logger.info(`Summary generated for call ${callId}`, { action: summary.action })

    // Get business to check notification preferences
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (business && summary.action !== "info") {
      // Send notification based on business preference
      await sendNotification(business, summary, callId)
    }
  } catch (error) {
    logger.error(`Error saving summary for call ${callId}:`, error)
    throw error
  }
}
