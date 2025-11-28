import { Request, Response, NextFunction } from "express"
import { clerkClient } from "@clerk/clerk-sdk-node"

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.substring(7)
    // Verify token with Clerk
    const session = await clerkClient.verifyToken(token)
    
    // Attach user info to request
    ;(req as any).user = session
    next()
  } catch (error) {
    console.error("Auth error:", error)
    return res.status(401).json({ error: "Unauthorized" })
  }
}

