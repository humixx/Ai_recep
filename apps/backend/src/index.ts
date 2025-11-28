import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { setupRoutes } from "./routes"
import { errorHandler } from "./middleware/errorHandler"
import { apiLimiter } from "./middleware/rateLimiter"
import logger from "./lib/logger"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
app.use("/api", apiLimiter)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Routes
setupRoutes(app)

// Error handling middleware (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`🚀 Backend server running on port ${PORT}`)
})

