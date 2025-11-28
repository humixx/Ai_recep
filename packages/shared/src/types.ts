import { z } from "zod"

// Call Summary Type
export const CallSummarySchema = z.object({
  callId: z.string(),
  callerNumber: z.string(),
  duration: z.number().optional(),
  summary: z.string(),
  extractedInfo: z.record(z.any()).optional(),
  timestamp: z.string(),
})

export type CallSummary = z.infer<typeof CallSummarySchema>

// Business Setup Type
export const BusinessSetupSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  businessType: z.string().optional(),
  timezone: z.string().default("UTC"),
})

export type BusinessSetup = z.infer<typeof BusinessSetupSchema>

// Appointment Type
export const AppointmentSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string(),
  customerEmail: z.string().email().optional(),
  serviceType: z.string().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
})

export type Appointment = z.infer<typeof AppointmentSchema>

