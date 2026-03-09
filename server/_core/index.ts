import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerSocialAuthRoutes } from "./socialAuth";
import { registerPhoneAuthRoutes } from "./phoneAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getGroupBuyByToken } from "../groupBuy";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check for Render / uptime monitoring
  app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

  // Manus OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Local auth: email+password register/login
  registerLocalAuthRoutes(app);
  // Social auth: Google OAuth + Telegram
  registerSocialAuthRoutes(app);
  // Phone auth: SMS OTP via Twilio
  registerPhoneAuthRoutes(app);

  // Open Graph endpoint for group buy share pages (social crawlers)
  app.get("/api/og/group-buy/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const origin = `${req.protocol}://${req.get("host")}`;
      const group = await getGroupBuyByToken(token, origin);
      if (!group) {
        return res.status(404).send("Group buy not found");
      }
      const title = `🔥 ${group.productName} 拼团 — ${group.currentTier.discountPct}% OFF`;
      const spotsLeft = Math.max(0, group.targetCount - group.currentCount);
      const description = spotsLeft > 0
        ? `已有 ${group.displayCount} 人参团，还需 ${spotsLeft} 人即可成团！现价 ${group.currentPrice.toFixed(2)} USDD（原价 ${group.originalPrice.toFixed(2)} USDD）`
        : `拼团已成功！${group.displayCount} 人参与，最终价格 ${group.currentPrice.toFixed(2)} USDD`;
      const imageUrl = group.imageUrl || `${origin}/og-default.png`;
      const pageUrl = `${origin}/group-buy/${token}`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Daiizen Global Marketplace" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">${pageUrl}</a>...</p>
</body>
</html>`;
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (err) {
      console.error("OG endpoint error:", err);
      return res.status(500).send("Internal error");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
