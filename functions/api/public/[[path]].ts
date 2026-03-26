/**
 * Cloudflare Pages Function: /api/public/*
 * Handles public product & category API for maoyan.vip cross-origin access.
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "public, max-age=60",
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
}

export const onRequest = async (ctx: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const origin = request.headers.get("origin") ?? "";

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const supabaseUrl =
    env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "";
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Supabase not configured" }, origin, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Route: GET /api/public/categories
  if (url.pathname === "/api/public/categories") {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, nameEn, nameEs, nameTr, namePt, nameAr, nameRu, iconUrl, sortOrder")
      .order("sortOrder", { ascending: true });
    if (error) return json({ error: error.message }, origin, 500);
    return json({ data: data ?? [] }, origin);
  }

  // Route: GET /api/public/products
  if (url.pathname === "/api/public/products") {
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
    const search = url.searchParams.get("q") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const sort = url.searchParams.get("sort") ?? "newest";
    const lang = url.searchParams.get("lang") ?? "en";

    let query = supabase
      .from("products")
      .select(
        "id, slug, nameEn, namePt, nameEs, nameAr, nameRu, nameTr, " +
        "descriptionEn, descriptionEs, descriptionPt, " +
        "priceUsdd, images, " +
        "categoryId, stock, isActive, createdAt",
        { count: "exact" }
      )
      .eq("isActive", 1);

    if (search) {
      query = query.or(`nameEn.ilike.%${search}%`);
    }
    if (category) {
      // join via category slug
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();
      if (cat) query = query.eq("categoryId", cat.id);
    }

    if (sort === "price_asc") query = query.order("priceUsdd", { ascending: true });
    else if (sort === "price_desc") query = query.order("priceUsdd", { ascending: false });
    else query = query.order("createdAt", { ascending: false });

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: error.message }, origin, 500);

    const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
    return json(
      {
        data: (data ?? []).map((p) => ({
          id: p.id,
          slug: p.slug,
          name: (p as Record<string, unknown>)[`name${langCap}`] || p.nameEn,
          nameEn: p.nameEn,
          description:
            (p as Record<string, unknown>)[`description${langCap}`] ||
            p.descriptionEn,
          priceUsdd: p.priceUsdd,
          images: p.images ?? [],
          categoryId: p.categoryId,
          stock: p.stock,
          isActive: p.isActive,
          createdAt: p.createdAt,
        })),
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
      origin
    );
  }

  // Route: GET /api/public/products/:slug
  const slugMatch = url.pathname.match(/^\/api\/public\/products\/(.+)$/);
  if (slugMatch) {
    const slug = slugMatch[1];
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("isActive", 1)
      .single();
    if (error || !data) return json({ error: "Not found" }, origin, 404);
    return json({ data }, origin);
  }

  return json({ error: "Not found" }, origin, 404);
};
