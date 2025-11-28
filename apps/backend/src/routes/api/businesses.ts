import { Router } from "express"
import { requireAuth } from "../../middleware/auth"
import { asyncHandler } from "../../middleware/errorHandler"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import logger from "../../lib/logger"

const router = Router()
const prisma = new PrismaClient()

// All routes require authentication
router.use(requireAuth)

// Business creation/update schema
const businessSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  businessType: z.string().optional(),
  services: z.array(z.object({
    name: z.string(),
    duration: z.number().optional(),
    price: z.number().optional(),
  })),
  hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().optional(),
  })),
  pricing: z.record(z.any()).optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  voiceTone: z.enum(["friendly", "professional", "casual"]).optional(),
  summaryChannel: z.enum(["whatsapp", "sms", "email"]).optional(),
  bookingRules: z.object({
    slots: z.array(z.string()).optional(),
    leadTime: z.number().optional(),
    maxAdvanceDays: z.number().optional(),
  }).optional(),
  timezone: z.string().optional(),
})

// Get current user's business
router.get("/", asyncHandler(async (req, res) => {
  const userId = (req as any).user?.sub || (req as any).user?.userId

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  const business = await prisma.business.findUnique({
    where: { clerkUserId: userId },
    include: {
      calls: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!business) {
    return res.status(404).json({ error: "Business not found" })
  }

  res.json(business)
}))

// Get business by ID
router.get("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = (req as any).user?.sub || (req as any).user?.userId

  const business = await prisma.business.findFirst({
    where: {
      id,
      clerkUserId: userId, // Ensure user owns this business
    },
    include: {
      calls: {
        take: 50,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!business) {
    return res.status(404).json({ error: "Business not found" })
  }

  res.json(business)
}))

// Create or update business (from wizard)
router.post("/", asyncHandler(async (req, res) => {
  const userId = (req as any).user?.sub || (req as any).user?.userId
  const userEmail = (req as any).user?.email

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  // Validate input
  const validatedData = businessSchema.parse(req.body)

  // Check if user exists, create if not
  let user = await prisma.user.findUnique({
    where: { email: userEmail || "" },
  })

  if (!user && userEmail) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        phone: validatedData.phoneNumber || null,
      },
    })
  }

  // Check if business exists
  const existingBusiness = await prisma.business.findUnique({
    where: { clerkUserId: userId },
  })

  let business

  if (existingBusiness) {
    // Update existing business
    business = await prisma.business.update({
      where: { id: existingBusiness.id },
      data: {
        ...validatedData,
        userId: user?.id || existingBusiness.userId,
      },
    })
    logger.info(`Business updated: ${business.id}`)
  } else {
    // Create new business
    if (!user) {
      return res.status(400).json({ error: "User must exist to create business" })
    }

    business = await prisma.business.create({
      data: {
        ...validatedData,
        userId: user.id,
        clerkUserId: userId,
      },
    })
    logger.info(`Business created: ${business.id}`)
  }

  res.status(existingBusiness ? 200 : 201).json(business)
}))

export default router
