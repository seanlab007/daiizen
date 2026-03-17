import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createContextFromRequest } from "../../server/_core/context-supabase";

export const onRequest = async (context: {
  request: Request;
  env: Record<string, string>;
  next: () => Promise<Response>;
}) => {
  const { request, env } = context;

  // Inject env vars into process.env for compatibility
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
    }
  }

  const url = new URL(request.url);

  // Health check
  if (url.pathname === "/api/health") {
    return new Response(JSON.stringify({ status: "ok", ts: Date.now() }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle tRPC requests
  if (url.pathname.startsWith("/api/trpc")) {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: () => createContextFromRequest(request),
      onError({ error, path }) {
        console.error(`tRPC error on ${path}:`, error);
      },
    });
  }

  return context.next();
};
