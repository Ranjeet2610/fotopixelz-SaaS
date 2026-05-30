import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import authRouter from "./modules/auth/auth.routes"
import usersRouter from "./modules/users/users.routes"
import organizationsRouter from "./modules/organizations/organizations.routes"
import servicesRouter from "./modules/services/services.routes"
import ordersRouter from "./modules/orders/orders.routes"
import uploadsRouter from "./modules/uploads/uploads.routes"
import assetsRouter from "./modules/assets/assets.routes"
import aiRouter from "./modules/ai/ai.routes"
import editingRouter from "./modules/editing/editing.routes"
import qaRouter from "./modules/qa/qa.routes"
import revisionsRouter from "./modules/revisions/revisions.routes"
import pricingRouter from "./modules/pricing/pricing.routes"
import paymentsRouter from "./modules/payments/payments.routes"
import notificationsRouter from "./modules/notifications/notifications.routes"
import analyticsRouter from "./modules/analytics/analytics.routes"
import adminRouter from "./modules/admin/admin.routes"
import workflowRouter from "./modules/workflow/workflow.routes"
import auditLogsRouter from "./modules/audit-logs/audit-logs.routes"
import { errorHandler } from "./common/middleware/error-handler"

const app = express()

app.use(cors())
app.use(helmet())
app.use(morgan("dev"))

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Fotopixelz API Running"
  })
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", usersRouter)
app.use("/api/v1/organizations", organizationsRouter)
app.use("/api/v1/services", servicesRouter)
app.use("/api/v1/orders", ordersRouter)
app.use("/api/v1/uploads", uploadsRouter)
app.use("/api/v1/assets", assetsRouter)
app.use("/api/v1/ai", aiRouter)
app.use("/api/v1/editing", editingRouter)
app.use("/api/v1/qa", qaRouter)
app.use("/api/v1/revisions", revisionsRouter)
app.use("/api/v1/pricing", pricingRouter)
app.use("/api/v1/payments", paymentsRouter)
app.use("/api/v1/notifications", notificationsRouter)
app.use("/api/v1/analytics", analyticsRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/workflow", workflowRouter)
app.use("/api/v1/audit-logs", auditLogsRouter)

app.use(errorHandler)

export default app
