/**
 * Cloudflare Pages Function: /api/points-lottery/*
 * Handles cross-platform points, lottery, and identity linking for maoyan × daiizen.
 */

import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = new Set([
  "https://maoyan.vip",
  "https://www.maoyan.vip",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4000",
]);

function corsHeaders(origin: string) {
  const allowed =
    ALLOWED_ORIGINS.has(origin) || origin.endsWith(".maoyan.vip")
      ? origin
      : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-maoyan-secret",
    "Content-Type": "application/json",
  };
}

function json(data: unknown, origin = "", status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  MAOYAN_LINK_SECRET?: string;
}

// ── Weighted random prize roll ─────────────────────────────────────────────
function rollPrize(prizes: Array<{ rank: number; name: string; probability: number; value: string; stock: number }>) {
  const rand = Math.random();
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += prize.probability;
    if (rand < cumulative) return prize;
  }
  return prizes[prizes.length - 1];
}

export const onRequest = async (ctx: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? "";
  const method = request.method;

  // Preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Supabase client
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "";
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Supabase not configured" }, origin, 500);
  }
  const sb = createClient(supabaseUrl, supabaseKey);

  // Secret auth helper
  const LINK_SECRET = env.MAOYAN_LINK_SECRET ?? "dev-link-secret-change-me";
  const reqSecret = request.headers.get("x-maoyan-secret") ?? "";
  const isAuthed = reqSecret === LINK_SECRET;

  const path = url.pathname; // e.g. /api/points-lottery/lotteries

  // ── GET /api/points-lottery/lotteries ──────────────────────────────────────
  if (method === "GET" && path === "/api/points-lottery/lotteries") {
    const { data, error } = await sb
      .from("lotteries")
      .select("*")
      .eq("status", "active")
      .order("id");
    if (error) return json({ error: error.message }, origin, 500);
    return json(data ?? [], origin);
  }

  // ── GET /api/points-lottery/points/:userId ─────────────────────────────────
  const pointsMatch = path.match(/^\/api\/points-lottery\/points\/(\d+)$/);
  if (method === "GET" && pointsMatch) {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const userId = parseInt(pointsMatch[1]);
    const { data } = await sb
      .from("user_points")
      .select("*")
      .eq("userId", userId)
      .single();
    return json(data ?? { userId, balance: 0, totalEarned: 0, totalSpent: 0 }, origin);
  }

  // ── POST /api/points-lottery/points/by-maoyan ──────────────────────────────
  if (method === "POST" && path === "/api/points-lottery/points/by-maoyan") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const body = await request.json() as { maoyanOpenId: string };
    const { data } = await sb
      .from("user_points")
      .select("*")
      .eq("maoyanOpenId", body.maoyanOpenId)
      .single();
    return json(data ?? { balance: 0, totalEarned: 0, totalSpent: 0 }, origin);
  }

  // ── POST /api/points-lottery/points/earn ──────────────────────────────────
  if (method === "POST" && path === "/api/points-lottery/points/earn") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const body = await request.json() as { userId: number; amount: number; source: string; note?: string };
    const { userId, amount, source, note } = body;

    // Upsert user_points
    const { data: existing } = await sb
      .from("user_points")
      .select("balance, totalEarned, totalSpent")
      .eq("userId", userId)
      .single();

    const current = existing ?? { balance: 0, totalEarned: 0, totalSpent: 0 };
    const newBalance = current.balance + amount;
    const newEarned = amount > 0 ? current.totalEarned + amount : current.totalEarned;
    const newSpent = amount < 0 ? current.totalSpent + Math.abs(amount) : current.totalSpent;

    await sb.from("user_points").upsert({
      userId,
      balance: newBalance,
      totalEarned: newEarned,
      totalSpent: newSpent,
      updatedAt: new Date().toISOString(),
    }, { onConflict: "userId" });

    await sb.from("points_transactions").insert({
      userId,
      amount,
      balance: newBalance,
      source,
      note: note ?? null,
    });

    return json({ balance: newBalance, earned: newEarned, spent: newSpent }, origin);
  }

  // ── POST /api/points-lottery/draw ─────────────────────────────────────────
  if (method === "POST" && path === "/api/points-lottery/draw") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const body = await request.json() as {
      lotteryId: number;
      userId?: number;
      maoyanOpenId?: string;
      sourcePlatform?: string;
    };
    let { lotteryId, userId, maoyanOpenId } = body;
    const sourcePlatform = body.sourcePlatform ?? "maoyan";

    // 若没有 userId，尝试通过 maoyanOpenId 从 maoyan_user_links 查找
    if (!userId && maoyanOpenId) {
      const { data: link } = await sb
        .from("maoyan_user_links")
        .select("daiizenUserId")
        .eq("maoyanOpenId", maoyanOpenId)
        .single();
      if (link) {
        userId = link.daiizenUserId;
      }
    }

    if (!userId) {
      return json({ error: "User not linked. Please link your daiizen account first." }, origin, 400);
    }

    // Get lottery config
    const { data: lottery, error: lErr } = await sb
      .from("lotteries")
      .select("*")
      .eq("id", lotteryId)
      .eq("status", "active")
      .single();
    if (lErr || !lottery) return json({ error: "Lottery not found or inactive" }, origin, 404);

    // Check points
    const { data: pts } = await sb
      .from("user_points")
      .select("balance")
      .eq("userId", userId)
      .single();
    const balance = pts?.balance ?? 0;
    if (balance < lottery.costPoints) {
      return json({ error: "Insufficient points", balance, required: lottery.costPoints }, origin, 400);
    }

    // Deduct points
    const newBalance = balance - lottery.costPoints;
    await sb.from("user_points").upsert({
      userId,
      balance: newBalance,
      totalSpent: ((pts as any)?.totalSpent ?? 0) + lottery.costPoints,
      updatedAt: new Date().toISOString(),
    }, { onConflict: "userId" });

    await sb.from("points_transactions").insert({
      userId,
      amount: -lottery.costPoints,
      balance: newBalance,
      source: "lottery",
      referenceId: String(lotteryId),
      note: `参与抽奖: ${lottery.title}`,
    });

    // Roll prize
    const prizes = (lottery.prizes ?? []) as Array<{ rank: number; name: string; probability: number; value: string; stock: number }>;
    const prize = rollPrize(prizes);
    const isWin = prize.rank <= prizes.length - 1 || prize.probability < 0.5;

    // Handle points-return prizes
    let finalBalance = newBalance;
    if (prize.value && prize.value.includes("积分")) {
      const ptMatch = prize.value.match(/(\d+)/);
      if (ptMatch) {
        const returnPts = parseInt(ptMatch[1]);
        finalBalance = newBalance + returnPts;
        await sb.from("user_points").upsert({
          userId,
          balance: finalBalance,
          totalEarned: ((pts as any)?.totalEarned ?? 0) + returnPts,
          updatedAt: new Date().toISOString(),
        }, { onConflict: "userId" });
        await sb.from("points_transactions").insert({
          userId,
          amount: returnPts,
          balance: finalBalance,
          source: "lottery",
          referenceId: String(lotteryId),
          note: `抽奖返积分: ${lottery.title}`,
        });
      }
    }

    // Record draw
    const { data: drawRecord } = await sb
      .from("lottery_draws")
      .insert({
        lotteryId,
        userId,
        maoyanOpenId: maoyanOpenId ?? null,
        sourcePlatform,
        result: isWin ? "win" : "lose",
        prizeRank: prize.rank,
        prizeName: prize.name,
        prizeValue: prize.value,
        pointsSpent: lottery.costPoints,
        isClaimed: prize.value?.includes("积分") ? 1 : 0,
      })
      .select()
      .single();

    // Increment totalDraws
    await sb
      .from("lotteries")
      .update({ totalDraws: (lottery.totalDraws ?? 0) + 1 })
      .eq("id", lotteryId);

    return json({
      result: isWin ? "win" : "lose",
      prize: { rank: prize.rank, name: prize.name, value: prize.value },
      pointsSpent: lottery.costPoints,
      newBalance: finalBalance,
      drawId: drawRecord?.id,
    }, origin);
  }

  // ── GET /api/points-lottery/draws/:userId ─────────────────────────────────
  const drawsMatch = path.match(/^\/api\/points-lottery\/draws\/(\d+)$/);
  if (method === "GET" && drawsMatch) {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const userId = parseInt(drawsMatch[1]);
    const { data } = await sb
      .from("lottery_draws")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(50);
    return json(data ?? [], origin);
  }

  // ── POST /api/points-lottery/draws/by-maoyan ──────────────────────────────
  if (method === "POST" && path === "/api/points-lottery/draws/by-maoyan") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const body = await request.json() as { maoyanOpenId: string };
    const { data } = await sb
      .from("lottery_draws")
      .select("*")
      .eq("maoyanOpenId", body.maoyanOpenId)
      .order("createdAt", { ascending: false })
      .limit(50);
    return json(data ?? [], origin);
  }

  // ── POST /api/points-lottery/claim/:drawId ────────────────────────────────
  const claimMatch = path.match(/^\/api\/points-lottery\/claim\/(\d+)$/);
  if (method === "POST" && claimMatch) {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const drawId = parseInt(claimMatch[1]);
    const { data, error } = await sb
      .from("lottery_draws")
      .update({ isClaimed: 1, claimedAt: new Date().toISOString() })
      .eq("id", drawId)
      .eq("isClaimed", 0)
      .select()
      .single();
    if (error || !data) return json({ error: "Draw not found or already claimed" }, origin, 400);
    return json({ success: true, draw: data }, origin);
  }

  // ── POST /api/points-lottery/link ─────────────────────────────────────────
  if (method === "POST" && path === "/api/points-lottery/link") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const body = await request.json() as {
      daiizenUserId: number;
      maoyanOpenId: string;
      maoyanEmail?: string;
    };
    const { daiizenUserId, maoyanOpenId, maoyanEmail } = body;
    const { data, error } = await sb
      .from("maoyan_user_links")
      .upsert({ daiizenUserId, maoyanOpenId, maoyanEmail: maoyanEmail ?? null, updatedAt: new Date().toISOString() }, {
        onConflict: "daiizenUserId",
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, origin, 500);
    return json({ success: true, link: data }, origin);
  }

  // ── GET /api/points-lottery/link/by-maoyan ────────────────────────────────
  if (method === "GET" && path === "/api/points-lottery/link/by-maoyan") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const maoyanOpenId = url.searchParams.get("id") ?? "";
    const { data } = await sb
      .from("maoyan_user_links")
      .select("*")
      .eq("maoyanOpenId", maoyanOpenId)
      .single();
    if (!data) return json({ error: "Link not found" }, origin, 404);
    return json(data, origin);
  }

  // ── GET /api/points-lottery/link/by-daiizen ───────────────────────────────
  if (method === "GET" && path === "/api/points-lottery/link/by-daiizen") {
    if (!isAuthed) return json({ error: "Unauthorized" }, origin, 403);
    const daiizenUserId = parseInt(url.searchParams.get("id") ?? "0");
    const { data } = await sb
      .from("maoyan_user_links")
      .select("*")
      .eq("daiizenUserId", daiizenUserId)
      .single();
    if (!data) return json({ error: "Link not found" }, origin, 404);
    return json(data, origin);
  }

  return json({ error: "Not found" }, origin, 404);
};
