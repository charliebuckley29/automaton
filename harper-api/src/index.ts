import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

import voiceRouter from "./routes/agent/voice.js";
import researchRouter from "./routes/research/run.js";
import reportsRouter from "./routes/reports/generate.js";
import stripeWebhookRouter from "./routes/webhooks/stripe.js";
import intelligenceRouter from "./routes/intelligence/update.js";
import emailRouter from "./routes/email/trigger.js";
import scorecardRouter from "./routes/scorecard/analyze.js";
import offersRouter from "./routes/offers/index.js";
import bulkRouter from "./routes/bulk/index.js";

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// JSON body parsing for every route *except* the Stripe webhook which needs
// the raw body in order to verify the signature.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/webhooks/stripe")) {
    next();
  } else {
    express.json({ limit: "5mb" })(req, res, next);
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Route mounting
// ---------------------------------------------------------------------------

app.use("/agent/voice", voiceRouter);
app.use("/research", researchRouter);
app.use("/reports", reportsRouter);
app.use("/webhooks/stripe", stripeWebhookRouter);
app.use("/intelligence", intelligenceRouter);
app.use("/email", emailRouter);
app.use("/scorecard", scorecardRouter);
app.use("/offers", offersRouter);
app.use("/bulk", bulkRouter);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[unhandled error]", err);

  const statusCode =
    "statusCode" in err ? (err as Error & { statusCode: number }).statusCode : 500;

  res.status(statusCode).json({
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? "8080", 10);

app.listen(PORT, () => {
  console.log(`Harper API listening on port ${PORT}`);
});

export default app;
