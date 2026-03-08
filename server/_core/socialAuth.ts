/**
 * Social Authentication: Google OAuth + Telegram Bot Login
 *
 * Routes:
 *  GET /api/auth/google           → redirect to Google consent screen
 *  GET /api/auth/google/callback  → handle Google callback, set session cookie
 *  GET /api/auth/telegram/callback → handle Telegram widget callback
 *  GET /api/auth/telegram/config   → return bot name for frontend widget
 *  GET /api/auth/social/status     → which providers are enabled
 */

import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { SignJWT } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// ─── Shared helpers ──────────────────────────────────────────────────────────

function generateOpenId(provider: string, id: string): string {
  return `${provider}_${Buffer.from(id).toString("base64url").slice(0, 40)}`;
}

async function createSocialSessionToken(openId: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret || "daiizen-fallback-secret-2024");
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, appId: ENV.appId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

async function upsertSocialUser(params: {
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string;
  googleId?: string;
  telegramId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const existing = await db.select().from(users).where(eq(users.openId, params.openId)).limit(1);
  if (existing.length > 0) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.openId, params.openId));
  } else {
    await db.insert(users).values({
      openId: params.openId,
      name: params.name,
      email: params.email,
      loginMethod: params.loginMethod,
      googleId: params.googleId,
      telegramId: params.telegramId,
      lastSignedIn: new Date(),
    });
  }
}

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

function registerGoogleOAuth(app: Express) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

  // Step 1: Redirect to Google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!GOOGLE_CLIENT_ID) {
      res.status(503).json({ error: "Google OAuth not configured" });
      return;
    }
    const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // Step 2: Handle Google callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.redirect("/?auth_error=google_no_code");
      return;
    }
    try {
      const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
      const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
      const { tokens } = await client.getToken(code);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload()!;
      const openId = generateOpenId("google", payload.sub);
      const name = payload.name || payload.email?.split("@")[0] || "User";

      await upsertSocialUser({
        openId,
        name,
        email: payload.email || null,
        loginMethod: "google",
        googleId: payload.sub,
      });

      const token = await createSocialSessionToken(openId, name);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect("/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.redirect("/?auth_error=google_failed");
    }
  });
}

// ─── Telegram OAuth ───────────────────────────────────────────────────────────

function registerTelegramOAuth(app: Express) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

  // Telegram widget callback
  app.get("/api/auth/telegram/callback", async (req: Request, res: Response) => {
    if (!TELEGRAM_BOT_TOKEN) {
      res.redirect("/?auth_error=telegram_not_configured");
      return;
    }
    try {
      const data = req.query as Record<string, string>;
      const { hash, ...rest } = data;

      // Verify hash
      const checkString = Object.keys(rest)
        .sort()
        .map((k) => `${k}=${rest[k]}`)
        .join("\n");
      const secretKey = crypto.createHash("sha256").update(TELEGRAM_BOT_TOKEN).digest();
      const expectedHash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

      if (expectedHash !== hash) {
        res.redirect("/?auth_error=telegram_invalid_hash");
        return;
      }

      // Check auth_date (must be within 24 hours)
      const authDate = parseInt(data.auth_date || "0");
      if (Date.now() / 1000 - authDate > 86400) {
        res.redirect("/?auth_error=telegram_expired");
        return;
      }

      const telegramId = data.id;
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      const username = data.username || "";
      const displayName = [firstName, lastName].filter(Boolean).join(" ") || username || "Telegram User";

      const openId = generateOpenId("telegram", telegramId);
      await upsertSocialUser({
        openId,
        name: displayName,
        email: null,
        loginMethod: "telegram",
        telegramId,
      });

      const token = await createSocialSessionToken(openId, displayName);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect("/");
    } catch (error) {
      console.error("[Telegram OAuth] Callback failed:", error);
      res.redirect("/?auth_error=telegram_failed");
    }
  });

  // Endpoint to get Telegram bot name (for frontend widget)
  app.get("/api/auth/telegram/config", (_req: Request, res: Response) => {
    const botName = process.env.TELEGRAM_BOT_NAME || "";
    res.json({ botName, configured: Boolean(TELEGRAM_BOT_TOKEN && botName) });
  });
}

// ─── OAuth Status Endpoint ────────────────────────────────────────────────────

function registerOAuthStatus(app: Express) {
  app.get("/api/auth/social/status", (_req: Request, res: Response) => {
    res.json({
      google: Boolean(process.env.GOOGLE_CLIENT_ID),
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    });
  });
}

// ─── Register All Social Auth Routes ─────────────────────────────────────────

export function registerSocialAuthRoutes(app: Express) {
  registerGoogleOAuth(app);
  registerTelegramOAuth(app);
  registerOAuthStatus(app);
  console.log("[SocialAuth] Google / Telegram OAuth routes registered");
}
