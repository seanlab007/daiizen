/**
 * Auth Integration Tests
 * Tests for Google OAuth config, Twilio Verify Service, and Email/Password auth
 */

import { describe, it, expect, beforeAll } from "vitest";

// ─── Credential Configuration Tests ──────────────────────────────────────────

describe("auth credentials", () => {
  it("GOOGLE_CLIENT_ID is configured", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeTruthy();
    expect(clientId).toContain(".apps.googleusercontent.com");
  });

  it("GOOGLE_CLIENT_SECRET is configured", () => {
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    expect(secret).toBeTruthy();
    expect(secret!.startsWith("GOCSPX-")).toBe(true);
  });

  it("TWILIO_ACCOUNT_SID is configured", () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    expect(sid).toBeTruthy();
    expect(sid!.startsWith("AC")).toBe(true);
  });

  it("TWILIO_AUTH_TOKEN is configured", () => {
    const token = process.env.TWILIO_AUTH_TOKEN;
    expect(token).toBeTruthy();
    expect(token!.length).toBeGreaterThan(20);
  });

  it("TWILIO_VERIFY_SERVICE_SID is configured", () => {
    const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
    expect(sid).toBeTruthy();
    expect(sid!.startsWith("VA")).toBe(true);
  });
});

// ─── Twilio Verify Service Tests ──────────────────────────────────────────────

describe("twilio verify service", () => {
  it("can connect to Twilio Verify Service", async () => {
    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const service = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .fetch();
    expect(service.sid).toBe(process.env.TWILIO_VERIFY_SERVICE_SID);
    expect(service.friendlyName).toBeTruthy();
  }, 10000);
});

// ─── Google OAuth URL Generation Tests ───────────────────────────────────────

describe("google oauth url generation", () => {
  it("generates valid Google OAuth URL", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const redirectUri = "https://daiizen.com/api/auth/google/callback";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: "test-state",
      access_type: "offline",
      prompt: "select_account",
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    expect(url).toContain("accounts.google.com");
    expect(url).toContain(clientId);
    expect(url).toContain("openid");
    expect(url).toContain("email");
    expect(url).toContain("profile");
  });
});

// ─── Phone Auth Helper Tests ──────────────────────────────────────────────────

describe("phone auth helpers", () => {
  it("normalizes phone numbers correctly", () => {
    const normalize = (phone: string) => phone.replace(/[^\d+]/g, "");
    expect(normalize("+1 (234) 567-8900")).toBe("+12345678900");
    expect(normalize("+86 138 0013 8000")).toBe("+8613800138000");
    expect(normalize("+55 11 91234-5678")).toBe("+5511912345678");
  });

  it("generates stable openId from phone number", () => {
    const generateOpenId = (phone: string) =>
      `phone_${Buffer.from(phone).toString("base64url").slice(0, 40)}`;
    const id1 = generateOpenId("+12345678900");
    const id2 = generateOpenId("+12345678900");
    expect(id1).toBe(id2);
    expect(id1.startsWith("phone_")).toBe(true);
  });
});

// ─── Email Auth Helper Tests ──────────────────────────────────────────────────

describe("email auth helpers", () => {
  it("generates stable openId from email", () => {
    const generateOpenId = (email: string) =>
      `local_${Buffer.from(email).toString("base64url").slice(0, 40)}`;
    const id1 = generateOpenId("test@example.com");
    const id2 = generateOpenId("test@example.com");
    expect(id1).toBe(id2);
    expect(id1.startsWith("local_")).toBe(true);
  });

  it("validates password minimum length", () => {
    const isValidPassword = (pwd: string) => pwd.length >= 6;
    expect(isValidPassword("12345")).toBe(false);
    expect(isValidPassword("123456")).toBe(true);
    expect(isValidPassword("securepassword")).toBe(true);
  });
});
