/**
 * Cloudflare Pages Function: /api/public/*
 * Handles public product & category API for maoyan.vip cross-origin access.
 *
 * Tables: daiizen_categories, daiizen_products (snake_case columns in Supabase)
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

/** Map DB snake_case category to API camelCase */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(c: any) {
  return {
    id: c.id,
    slug: c.slug,
    nameEn: c.name_en,
    nameEs: c.name_es,
    nameTr: c.name_tr,
    namePt: c.name_pt,
    nameAr: c.name_ar,
    nameRu: c.name_ru,
    iconUrl: c.icon_url,
    sortOrder: c.sort_order,
  };
}

/** Map DB snake_case product to API camelCase, with localized name/description */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(p: any, lang = "en") {
  const langKey = lang.toLowerCase();
  const nameKey = `name_${langKey}`;
  const descKey = `description_${langKey}`;
  return {
    id: p.id,
    slug: p.slug,
    name: p[nameKey] || p.name_en || "",
    nameEn: p.name_en,
    description: p[descKey] || p.description_en || null,
    priceUsdd: p.price_usdd,
    images: p.images ?? [],
    categoryId: p.category_id,
    stock: p.stock,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
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

  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "";
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Supabase not configured" }, origin, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ── GET /api/public/categories ───────────────────────────────────────────
  if (url.pathname === "/api/public/categories") {
    const { data, error } = await supabase
      .from("daiizen_categories")
      .select("id, slug, name_en, name_es, name_tr, name_pt, name_ar, name_ru, icon_url, sort_order")
      .order("sort_order", { ascending: true });
    if (error) return json({ error: error.message }, origin, 500);
    return json({ data: (data ?? []).map(mapCategory) }, origin);
  }

  // ── GET /api/public/products ─────────────────────────────────────────────
  if (url.pathname === "/api/public/products") {
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
    const search = url.searchParams.get("q") ?? url.searchParams.get("search") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const sort = url.searchParams.get("sort") ?? "newest";
    const lang = url.searchParams.get("lang") ?? "en";

    let query = supabase
      .from("daiizen_products")
      .select(
        "id, slug, name_en, name_es, name_tr, name_pt, name_ar, name_ru, " +
        "description_en, description_es, description_pt, " +
        "price_usdd, images, " +
        "category_id, stock, is_active, is_featured, created_at, updated_at",
        { count: "exact" }
      )
      .eq("is_active", true);

    if (search) {
      query = query.or(`name_en.ilike.%${search}%`);
    }
    if (category) {
      const { data: cat } = await supabase
        .from("daiizen_categories")
        .select("id")
        .eq("slug", category)
        .single();
      if (cat) query = query.eq("category_id", cat.id);
    }

    if (sort === "price_asc") query = query.order("price_usdd", { ascending: true });
    else if (sort === "price_desc") query = query.order("price_usdd", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) return json({ error: error.message }, origin, 500);

    return json(
      {
        data: (data ?? []).map((p) => mapProduct(p, lang)),
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

  // ── GET /api/public/products/:slug ───────────────────────────────────────
  const slugMatch = url.pathname.match(/^\/api\/public\/products\/(.+)$/);
  if (slugMatch) {
    const slug = slugMatch[1];
    const lang = url.searchParams.get("lang") ?? "en";
    const { data, error } = await supabase
      .from("daiizen_products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    if (error || !data) return json({ error: "Not found" }, origin, 404);
    return json({ data: mapProduct(data, lang) }, origin);
  }

  return json({ error: "Not found" }, origin, 404);
};
