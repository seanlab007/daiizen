import { createClient } from "@supabase/supabase-js";
import type { User } from "../../drizzle/schema";
import { upsertUser, getUserByOpenId } from "../db";

export type TrpcContext = {
  user: User | null;
};

export async function createContextFromRequest(request: Request): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get the Authorization header (Bearer token from Supabase)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = authHeader.slice(7);
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);

    if (error || !sbUser) {
      return { user: null };
    }

    // Upsert user in our DB using Supabase user ID as openId
    await upsertUser({
      openId: sbUser.id,
      name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split("@")[0] || null,
      email: sbUser.email || null,
      loginMethod: sbUser.app_metadata?.provider || null,
      lastSignedIn: new Date(),
    });

    user = (await getUserByOpenId(sbUser.id)) ?? null;
  } catch (error) {
    console.warn("[Auth] Failed to authenticate request:", error);
    user = null;
  }

  return { user };
}
