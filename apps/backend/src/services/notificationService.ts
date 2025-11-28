import { PrismaClient, Business, SummaryChannel } from "@prisma/client"
import twilio from "twilio"
import logger from "../lib/logger"

const prisma = new PrismaClient()
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface CallSummary {
  intent: string
  details: Record<string, any>
  action: "callback" | "booking" | "quote" | "info"
}

/**
 * Send notification to business owner based on their preference
 */
export async function sendNotification(
  business: Business,
  summary: CallSummary,
  callId: string
): Promise<void> {
  const message = formatNotificationMessage(business, summary, callId)

  try {
    switch (business.summaryChannel) {
      case SummaryChannel.sms:
        await sendSMS(business.phoneNumber || "", message)
        break

      case SummaryChannel.whatsapp:
        await sendWhatsApp(business.phoneNumber || "", message)
        break

      case SummaryChannel.email:
        await sendEmail(business.email || "", message, summary)
        break

      default:
        logger.warn(`Unknown summary channel: ${business.summaryChannel}`)
    }

    logger.info(`Notification sent via ${business.summaryChannel} for call ${callId}`)
  } catch (error) {
    logger.error(`Error sending notification for call ${callId}:`, error)
  }
}

function formatNotificationMessage(
  business: Business,
  summary: CallSummary,
  callId: string
): string {
  const actionEmoji = {
    callback: "📞",
    booking: "📅",
    quote: "💰",
    info: "ℹ️",
  }[summary.action] || "📞"

  return `${actionEmoji} New ${business.name} Call Summary

Intent: ${summary.intent}
Action: ${summary.action}

Details:
${Object.entries(summary.details)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join("\n")}

View full details: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calls/${callId}`
}

async function sendSMS(to: string, message: string): Promise<void> {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("TWILIO_PHONE_NUMBER not configured")
  }

  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to,
  })
}

async function sendWhatsApp(to: string, message: string): Promise<void> {
  // Use Twilio WhatsApp API or WhatsApp Business API
  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("TWILIO_PHONE_NUMBER not configured")
  }

  // Format phone number for WhatsApp (remove + and add country code)
  const whatsappNumber = `whatsapp:${to}`

  await twilioClient.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: whatsappNumber,
  })
}

async function sendEmail(
  to: string,
  message: string,
  summary: CallSummary
): Promise<void> {
  // TODO: Implement email sending (using SendGrid, AWS SES, etc.)
  logger.info(`Email notification would be sent to ${to}`, { summary })
  // For now, just log
}

