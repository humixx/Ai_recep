import { Express } from "express"
import vapiWebhookRouter from "./webhooks/vapi"
import businessesRouter from "./api/businesses"
import callsRouter from "./api/calls"
import vapiRouter from "./api/vapi"

export function setupRoutes(app: Express) {
  // Webhooks
  app.use("/webhooks/vapi", vapiWebhookRouter)
  
  // API routes
  app.use("/api/businesses", businessesRouter)
  app.use("/api/calls", callsRouter)
  app.use("/api/vapi", vapiRouter) // Vapi API routes (create calls, assistants, etc.)
}

