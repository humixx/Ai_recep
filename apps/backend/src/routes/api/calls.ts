import { Router } from "express"
import { requireAuth } from "../../middleware/auth"
import { asyncHandler } from "../../middleware/errorHandler"
import { PrismaClient } from "@prisma/client"
import logger from "../../lib/logger"

const router = Router()
const prisma = new PrismaClient()

// All routes require authentication
router.use(requireAuth)

// Get call history with pagination and filters
router.get("/", asyncHandler(async (req, res) => {
  const userId = (req as any).user?.sub || (req as any).user?.userId
  const { businessId, status, page = "1", limit = "20", startDate, endDate } = req.query

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  // Find user's business
  const business = await prisma.business.findUnique({
    where: { clerkUserId: userId },
  })

  if (!business) {
    return res.status(404).json({ error: "Business not found" })
  }

  // Build where clause
  const where: any = {
    businessId: businessId || business.id,
  }

  if (status) {
    where.status = status
  }

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) {
      where.timestamp.gte = new Date(startDate as string)
    }
    if (endDate) {
      where.timestamp.lte = new Date(endDate as string)
    }
  }

  // Pagination
  const pageNum = parseInt(page as string, 10)
  const limitNum = parseInt(limit as string, 10)
  const skip = (pageNum - 1) * limitNum

  // Get calls and total count
  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { timestamp: "desc" },
      include: {
        appointments: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.call.count({ where }),
  ])

  res.json({
    calls,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  })
}))

// Get call details
router.get("/:callId", asyncHandler(async (req, res) => {
  const userId = (req as any).user?.sub || (req as any).user?.userId
  const { callId } = req.params

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" })
  }

  // Find user's business
  const business = await prisma.business.findUnique({
    where: { clerkUserId: userId },
  })

  if (!business) {
    return res.status(404).json({ error: "Business not found" })
  }

  const call = await prisma.call.findFirst({
    where: {
      id: callId,
      businessId: business.id,
    },
    include: {
      appointments: true,
      business: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!call) {
    return res.status(404).json({ error: "Call not found" })
  }

  res.json(call)
}))

export default router
