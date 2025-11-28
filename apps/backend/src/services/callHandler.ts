import { PrismaClient, CallStatus } from "@prisma/client"
import logger from "../lib/logger"

const prisma = new PrismaClient()

// Vapi webhook event types
export interface VapiWebhookEvent {
  message?: {
    type: string
    functionCall?: {
      name: string
      parameters: any
    }
    transcript?: string
  }
  call?: {
    id: string
    direction: "inbound" | "outbound"
    status: string
    from: string
    to: string
    startedAt?: string
    endedAt?: string
    duration?: number
    recordingUrl?: string
    transcript?: string
  }
  type: string // "call-start", "call-end", "function-call", "status-update", etc.
}

/**
 * Handle Vapi webhook events
 * Vapi sends various event types:
 * - call-start: When a call begins
 * - call-end: When a call ends
 * - status-update: Call status changes
 * - function-call: When assistant calls a function/tool
 * - transcript: Real-time transcript updates
 */
export async function handleVapiWebhook(event: VapiWebhookEvent): Promise<void> {
  console.log("Received Vapi webhook:", event.type)

  switch (event.type) {
    case "call-start":
      await handleCallStart(event)
      break

    case "call-end":
      await handleCallEnd(event)
      break

    case "status-update":
      await handleStatusUpdate(event)
      break

    case "function-call":
      await handleFunctionCall(event)
      break

    case "transcript":
      await handleTranscript(event)
      break

    default:
      console.log(`Unhandled webhook type: ${event.type}`)
  }
}

async function handleCallStart(event: VapiWebhookEvent) {
  if (!event.call) return

  const { id, direction, from, to } = event.call as any

  // Find business by phone number or assistant ID
  // You may need to store assistant-to-business mapping
  const business = await findBusinessByPhoneNumber(to)
  if (!business) {
    logger.error(`Business not found for phone number: ${to}`)
    return
  }

  // Create call record
  await prisma.call.create({
    data: {
      vapiCallId: id,
      businessId: business.id,
      callerPhone: from,
      direction: direction || "inbound",
      status: CallStatus.answered,
      timestamp: new Date(),
      vapiMetadata: event.call,
    },
  })

  logger.info(`Call started: ${id} for business: ${business.name}`)
}

async function handleCallEnd(event: VapiWebhookEvent) {
  if (!event.call) return

  const { id, status, duration, recordingUrl, transcript } = event.call

  // Update call record
  const call = await prisma.call.update({
    where: { vapiCallId: id! },
    data: {
      status: CallStatus.completed,
      duration: duration,
      audioUrl: recordingUrl,
      transcript: transcript,
      vapiMetadata: event.call,
    },
  })

  // Queue summary generation
  if (transcript) {
    // TODO: Add to BullMQ queue for async summary generation
    // await summaryQueue.add('generate-summary', { callId: call.id })
    // For now, generate summary synchronously
    try {
      const { generateAndSaveSummary } = await import("./summaryGenerator")
      await generateAndSaveSummary(call.id, transcript, call.businessId)
    } catch (error) {
      logger.error(`Error generating summary for call ${call.id}:`, error)
    }
  }

  logger.info(`Call ended: ${id}, duration: ${duration}s`)
}

async function handleStatusUpdate(event: VapiWebhookEvent) {
  if (!event.call) return

  const { id, status } = event.call

  // Map Vapi status to our CallStatus enum
  let callStatus: CallStatus = CallStatus.answered
  if (status === "ended" || status === "completed") {
    callStatus = CallStatus.completed
  } else if (status === "failed" || status === "no-answer") {
    callStatus = CallStatus.missed
  }

  await prisma.call.update({
    where: { vapiCallId: id! },
    data: {
      status: callStatus,
      vapiMetadata: event.call,
    },
  })
}

async function handleFunctionCall(event: VapiWebhookEvent) {
  if (!event.message?.functionCall) return

  const { name, parameters } = event.message.functionCall
  const callId = (event.call as any)?.id

  if (!callId) return

  // Handle different function calls (e.g., book_appointment, extract_info)
  switch (name) {
    case "book_appointment":
      await handleAppointmentBooking(callId, parameters)
      break

    case "extract_customer_info":
      await handleInfoExtraction(callId, parameters)
      break

    default:
      console.log(`Unhandled function call: ${name}`)
  }
}

async function handleTranscript(event: VapiWebhookEvent) {
  if (!event.message?.transcript || !event.call) return

  // Update transcript in real-time (optional - can also wait for call-end)
  // This is useful for real-time display in dashboard
  const { id } = event.call
  const transcript = event.message.transcript

  await prisma.call.update({
    where: { vapiCallId: id! },
    data: {
      transcript: transcript,
    },
  })
}

async function handleAppointmentBooking(callId: string, parameters: any) {
  const call = await prisma.call.findUnique({
    where: { vapiCallId: callId },
  })

  if (!call) return

  // Create appointment from function call parameters
  await prisma.appointment.create({
    data: {
      businessId: call.businessId,
      callId: call.id,
      customerName: parameters.customerName,
      customerPhone: parameters.customerPhone,
      customerEmail: parameters.customerEmail,
      serviceType: parameters.serviceType,
      scheduledAt: new Date(parameters.scheduledAt),
      notes: parameters.notes,
      status: "pending",
    },
  })

  console.log(`Appointment booked via call: ${callId}`)
}

async function handleInfoExtraction(callId: string, parameters: any) {
  const call = await prisma.call.findUnique({
    where: { vapiCallId: callId },
  })

  if (!call) return

  // Update extracted info
  await prisma.call.update({
    where: { vapiCallId: callId },
    data: {
      extractedInfo: parameters,
    },
  })
}

async function findBusinessByPhoneNumber(phoneNumber: string) {
  return await prisma.business.findFirst({
    where: {
      phoneNumber: phoneNumber,
    },
  })
}

/**
 * Create an outbound call via Vapi API
 */
export async function createOutboundCall(
  businessId: string,
  phoneNumber: string,
  assistantId: string
): Promise<string> {
  // TODO: Implement Vapi API call to create outbound call
  // This will use Vapi's REST API
  // POST https://api.vapi.ai/call
  // {
  //   "assistantId": assistantId,
  //   "customer": { "number": phoneNumber }
  // }

  return "vapi-call-id-placeholder"
}
