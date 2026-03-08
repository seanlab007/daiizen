/**
 * Phone (SMS OTP) Authentication via Twilio Verify Service
 *
 * Flow:
 *  1. POST /api/auth/phone/send-otp   – send OTP via Twilio Verify Service
 *  2. POST /api/auth/phone/verify-otp – validate code with Twilio, create/login user, set session cookie
 */

import type { Express, Request, Response } from "express";
import { SignJWT } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// ─── Twilio Verify client (lazy-initialised) ──────────────────────────────────
let _twilioClient: ReturnType<typeof import("twilio")> | null = null;

function getTwilioClient() {
  if (_twilioClient) return _twilioClient;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require("twilio");
  _twilioClient = twilio(accountSid, authToken);
  return _twilioClient;
}

function getVerifyServiceSid(): string {
  return process.env.TWILIO_VERIFY_SERVICE_SID || "";
}

async function sendVerifyOtp(phone: string): Promise<void> {
  const client = getTwilioClient();
  const serviceSid = getVerifyServiceSid();

  if (!client || !serviceSid) {
    // Dev mode: log to console
    console.log(`[PhoneAuth] DEV MODE - Twilio not configured. OTP would be sent to ${phone}`);
    return;
  }

  await (client as any).verify.v2.services(serviceSid).verifications.create({
    to: phone,
    channel: "sms",
  });
}

async function checkVerifyOtp(phone: string, code: string): Promise<boolean> {
  const client = getTwilioClient();
  const serviceSid = getVerifyServiceSid();

  if (!client || !serviceSid) {
    // Dev mode: accept any 6-digit code
    console.log(`[PhoneAuth] DEV MODE - Accepting code ${code} for ${phone}`);
    return code.length === 6;
  }

  try {
    const result = await (client as any).verify.v2.services(serviceSid).verificationChecks.create({
      to: phone,
      code,
    });
    return result.status === "approved";
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[PhoneAuth] Twilio verify check failed:", errMsg);
    return false;
  }
}

function generateOpenId(phone: string): string {
  return `phone_${Buffer.from(phone).toString("base64url").slice(0, 40)}`;
}

async function createPhoneSessionToken(openId: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret || "daiizen-fallback-secret-2024");
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, appId: ENV.appId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

export function registerPhoneAuthRoutes(app: Express) {
  // Step 1: Send OTP via Twilio Verify
  app.post("/api/auth/phone/send-otp", async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }
    // Normalize: keep only + and digits
    const normalized = phone.replace(/[^\d+]/g, "");
    if (normalized.length < 8) {
      res.status(400).json({ error: "Invalid phone number" });
      return;
    }

    try {
      await sendVerifyOtp(normalized);
      res.json({ success: true });
    } catch (error) {
      console.error("[PhoneAuth] Failed to send OTP:", error);
      res.status(500).json({ error: "Failed to send verification code. Please check your phone number and try again." });
    }
  });

  // Step 2: Verify OTP via Twilio Verify
  app.post("/api/auth/phone/verify-otp", async (req: Request, res: Response) => {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      res.status(400).json({ error: "Phone and code are required" });
      return;
    }
    const normalized = phone.replace(/[^\d+]/g, "");

    try {
      const approved = await checkVerifyOtp(normalized, code.toString());
      if (!approved) {
        res.status(400).json({ error: "Invalid or expired verification code" });
        return;
      }

      const db = await getDb();
      if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

      const openId = generateOpenId(normalized);
      const displayName = name?.trim() || `User_${normalized.slice(-4)}`;

      const existing = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.openId, openId));
      } else {
        await db.insert(users).values({
          openId,
          name: displayName,
          phoneNumber: normalized,
          loginMethod: "phone",
          lastSignedIn: new Date(),
        });
      }

      const token = await createPhoneSessionToken(openId, displayName);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[PhoneAuth] Verify failed:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // Resend OTP
  app.post("/api/auth/phone/resend-otp", async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) { res.status(400).json({ error: "Phone number is required" }); return; }
    const normalized = phone.replace(/[^\d+]/g, "");

    try {
      await sendVerifyOtp(normalized);
      res.json({ success: true });
    } catch (error) {
      console.error("[PhoneAuth] Failed to resend OTP:", error);
      res.status(500).json({ error: "Failed to resend verification code" });
    }
  });
}
