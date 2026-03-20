import { Request, Response, NextFunction } from "express";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.warn(
    "[elevenlabs middleware] ELEVENLABS_API_KEY not set – requests will be rejected",
  );
}

/**
 * Middleware that verifies incoming ElevenLabs webhook / custom-LLM requests.
 * ElevenLabs sends the configured API key in the `x-api-key` header so we can
 * ensure the request actually originated from our ElevenLabs agent.
 */
export function verifyElevenLabs(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingKey = req.headers["x-api-key"] as string | undefined;

  if (!ELEVENLABS_API_KEY) {
    res.status(500).json({ error: "ElevenLabs API key not configured on server" });
    return;
  }

  if (!incomingKey || incomingKey !== ELEVENLABS_API_KEY) {
    res.status(401).json({ error: "Invalid ElevenLabs API key" });
    return;
  }

  next();
}
