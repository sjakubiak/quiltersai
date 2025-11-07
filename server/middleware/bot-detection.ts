import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Known bot patterns in User-Agent strings
const BOT_UA_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /scrape/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /apache-httpclient/i,
  /java\//i,
  /okhttp/i,
  /go-http-client/i,
  /axios/i,
];

// In-memory rate limiting tracker
interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

const rateLimitTracker = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_THRESHOLD = 100; // requests per minute

/**
 * Clean up old rate limit entries (older than 2 minutes)
 */
function cleanupRateLimitTracker() {
  const now = Date.now();
  const cutoff = now - (RATE_LIMIT_WINDOW_MS * 2);
  
  for (const [ip, entry] of Array.from(rateLimitTracker.entries())) {
    if (entry.lastRequest < cutoff) {
      rateLimitTracker.delete(ip);
    }
  }
}

// Run cleanup every 2 minutes
setInterval(cleanupRateLimitTracker, RATE_LIMIT_WINDOW_MS * 2);

/**
 * Calculate bot score based on multiple signals
 * Score is 0-100, where higher = more likely bot
 */
export function calculateBotScore(
  req: Request,
  ipRateLimit: { count: number; withinWindow: boolean }
): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"];
  const acceptEncoding = req.headers["accept-encoding"];
  const referer = req.headers["referer"];

  // 1. Check User Agent
  if (!userAgent) {
    score += 50;
    flags.push("missing_user_agent");
  } else {
    // Check for known bot patterns
    for (const pattern of BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        score += 40;
        flags.push("bot_user_agent");
        break;
      }
    }

    // Check for outdated browsers (suspiciously old versions)
    if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
      score += 15;
      flags.push("outdated_browser");
    }
  }

  // 2. Check for missing common headers
  if (!acceptLanguage) {
    score += 20;
    flags.push("missing_accept_language");
  }

  if (!acceptEncoding) {
    score += 20;
    flags.push("missing_accept_encoding");
  }

  // 3. Check header ordering (bots often send alphabetically)
  const headerKeys = Object.keys(req.headers);
  const sortedKeys = [...headerKeys].sort();
  if (JSON.stringify(headerKeys) === JSON.stringify(sortedKeys)) {
    score += 15;
    flags.push("alphabetical_headers");
  }

  // 4. Check for platform mismatches
  const secChUaPlatform = req.headers["sec-ch-ua-platform"];
  if (secChUaPlatform && typeof secChUaPlatform === "string") {
    const uaPlatform = userAgent.toLowerCase();
    const chPlatform = secChUaPlatform.toLowerCase();
    
    if (
      (chPlatform.includes("windows") && uaPlatform.includes("mac")) ||
      (chPlatform.includes("mac") && uaPlatform.includes("windows"))
    ) {
      score += 30;
      flags.push("platform_mismatch");
    }
  }

  // 5. Rate limiting check
  if (ipRateLimit.withinWindow && ipRateLimit.count > RATE_LIMIT_THRESHOLD) {
    const excessMultiplier = Math.min(ipRateLimit.count / RATE_LIMIT_THRESHOLD, 5);
    score += Math.min(60, 30 * excessMultiplier);
    flags.push(`rate_limit_${ipRateLimit.count}_per_min`);
  }

  // 6. Check for suspicious paths
  const path = req.path.toLowerCase();
  const suspiciousPaths = ["/wp-admin", "/phpmyadmin", "/.env", "/config"];
  if (suspiciousPaths.some((p) => path.includes(p))) {
    score += 50;
    flags.push("suspicious_path");
  }

  // Cap score at 100
  score = Math.min(100, score);

  return { score, flags };
}

/**
 * Get client IP address, accounting for proxies
 */
function getClientIp(req: Request): string {
  // Check various headers that might contain the real IP
  const xForwardedFor = req.headers["x-forwarded-for"];
  const xRealIp = req.headers["x-real-ip"];
  const cfConnectingIp = req.headers["cf-connecting-ip"]; // Cloudflare
  
  if (typeof xForwardedFor === "string") {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(",")[0].trim();
  }
  
  if (typeof xRealIp === "string") {
    return xRealIp;
  }
  
  if (typeof cfConnectingIp === "string") {
    return cfConnectingIp;
  }
  
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Bot detection middleware
 * Tracks all requests and calculates bot scores
 */
export function botDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || null;
  const user = (req as any).user;
  const userId = user?.claims?.sub || null;
  const sessionId = req.sessionID || null;

  // Update rate limiting tracker
  const now = Date.now();
  let rateLimitEntry = rateLimitTracker.get(ip);
  
  if (!rateLimitEntry) {
    rateLimitEntry = { count: 1, firstRequest: now, lastRequest: now };
    rateLimitTracker.set(ip, rateLimitEntry);
  } else {
    // Check if within rate limit window
    if (now - rateLimitEntry.firstRequest < RATE_LIMIT_WINDOW_MS) {
      rateLimitEntry.count++;
      rateLimitEntry.lastRequest = now;
    } else {
      // Reset window
      rateLimitEntry = { count: 1, firstRequest: now, lastRequest: now };
      rateLimitTracker.set(ip, rateLimitEntry);
    }
  }

  const ipRateLimit = {
    count: rateLimitEntry.count,
    withinWindow: now - rateLimitEntry.firstRequest < RATE_LIMIT_WINDOW_MS,
  };

  // Calculate bot score
  const { score, flags } = calculateBotScore(req, ipRateLimit);

  // Track response
  res.on("finish", async () => {
    const responseTimeMs = Date.now() - startTime;
    
    try {
      // Only track API routes to avoid spam from static assets
      if (req.path.startsWith("/api")) {
        await storage.createRequestAnalytics({
          ipAddress: ip,
          userAgent,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userId,
          sessionId,
          headers: req.headers as any,
          botScore: score,
          botFlags: flags.length > 0 ? flags : null,
          responseTimeMs,
        });
      }
    } catch (error) {
      // Don't break the request if analytics tracking fails
      console.error("Error tracking request analytics:", error);
    }
  });

  next();
}
