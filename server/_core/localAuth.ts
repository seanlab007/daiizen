/**
 * Local (Email + Password) Authentication
 * POST /api/auth/register - create account with email+password
 * POST /api/auth/login    - sign in with email+password
 */

import bcrypt from "bcryptjs";
import type { Express, Request, Response } from "express";
import { SignJWT } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

const COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function generateOpenId(email: string): string {
  return `local_${Buffer.from(email).toString("base64url").slice(0, 40)}`;
}

async function createLocalSessionToken(openId: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret || "daiizen-fallback-secret-2024");
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, appId: ENV.appId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

export function registerLocalAuthRoutes(app: Express) {
  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const openId = generateOpenId(email);
      const displayName = name || email.split("@")[0];

      await db.insert(users).values({
        openId,
        name: displayName,
        email,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const token = await createLocalSessionToken(openId, displayName);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[LocalAuth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

      const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = userList[0];
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const displayName = user.name || email.split("@")[0];
      const token = await createLocalSessionToken(user.openId, displayName);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
