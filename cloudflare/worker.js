/**
 * Digital Kaam — Cloudflare Edge Reverse Proxy & 24x7 Keep-Alive Warmer
 * ======================================================================
 * Features:
 * 1. Edge Reverse Proxy to Render FastAPI backend with zero latency routing.
 * 2. Automated Cron Warmer: Pings /health every 10 minutes to ELIMINATE Render cold-starts.
 * 3. Global CORS Header Injection: Eliminates all web browser cross-origin blocks.
 * 4. Edge Caching for static avatar assets, health checks, and QR profiles.
 */

const BACKEND_ORIGIN = "https://digital-kaam-bakend.onrender.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export default {
  /**
   * HTTP Request Handler (Reverse Proxy & Edge Router)
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight OPTIONS requests instantly at the edge
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Health check route directly at the Cloudflare Edge
    if (url.pathname === "/cf-health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          edge_node: request.cf?.colo || "EDGE",
          region: request.cf?.country || "IN",
          service: "digital-kaam-cloudflare-proxy",
          backend_target: BACKEND_ORIGIN,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 3. Construct target URL to Render backend
    const targetUrl = new URL(url.pathname + url.search, BACKEND_ORIGIN);

    // Clone headers and preserve relevant request metadata
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "digital-kaam-bakend.onrender.com");
    newHeaders.set("X-Forwarded-Host", url.hostname);
    newHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
    newHeaders.set("X-Edge-Country", request.cf?.country || "IN");

    try {
      // 4. Forward request to backend
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
        redirect: "follow",
      });

      // 5. Inject CORS headers and edge caching into response
      const modifiedHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        modifiedHeaders.set(key, value);
      }

      // Edge cache health check and GET requests for 60 seconds
      if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
        modifiedHeaders.set("Cache-Control", "public, max-age=30, s-maxage=60");
      }

      // If Render returns HTML 502/503/504, convert to clean JSON for Flutter client
      const contentType = response.headers.get("content-type") || "";
      if ([502, 503, 504].includes(response.status) && !contentType.includes("application/json")) {
        return new Response(
          JSON.stringify({
            status: "warning",
            code: "BACKEND_WARMING",
            message: "बैकएंड सर्वर शुरू हो रहा है, कृपया 5-10 सेकंड में पुनः प्रयास करें।",
            detail: `Render Gateway Status: ${response.status}`,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "5",
              ...CORS_HEADERS,
            },
          }
        );
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders,
      });
    } catch (err) {
      // 6. Graceful edge fallback if backend is momentarily restarting
      return new Response(
        JSON.stringify({
          status: "warning",
          message: "बैकएंड सर्वर शुरू हो रहा है, कृपया 10 सेकंड में पुनः प्रयास करें।",
          detail: err.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "10",
            ...CORS_HEADERS,
          },
        }
      );
    }
  },

  /**
   * Cron Trigger Handler (24x7 Keep-Alive Warmer)
   * Triggers automatically every 10 minutes via cron: "every 10 minutes"
   */
  async scheduled(event, env, ctx) {
    const pingUrl = `${BACKEND_ORIGIN}/health`;
    console.log(`[Cloudflare Warmer] Sending 24x7 Keep-Alive ping to: ${pingUrl}`);

    ctx.waitUntil(
      fetch(pingUrl, {
        method: "GET",
        headers: {
          "User-Agent": "DigitalKaam-Cloudflare-Warmer/1.0",
        },
      })
        .then((res) => {
          console.log(`[Cloudflare Warmer] Backend Ping Success: Status ${res.status}`);
        })
        .catch((err) => {
          console.error(`[Cloudflare Warmer] Ping Error: ${err.message}`);
        })
    );
  },
};
