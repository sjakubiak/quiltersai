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

  // 6. Check for suspicious paths (WordPress scanners, admin panels, config files)
  const path = req.path.toLowerCase();
  const wordpressPaths = [
    "wp-admin",
    "wp-login",
    "wp-content",
    "wp-includes",
    "xmlrpc.php",
    "wp-config",
    "wordpress",
    ".php",
  ];
  const otherSuspiciousPaths = [
    "phpmyadmin",
    "/.env",
    "/config",
    "/.git",
    "/admin",
    "/administrator",
    "/manager",
    "/console",
  ];

  // WordPress-specific detection (very high score)
  if (wordpressPaths.some((p) => path.includes(p))) {
    score += 80;
    flags.push("wordpress_scanner");
  } else if (otherSuspiciousPaths.some((p) => path.includes(p))) {
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

// Auto-block threshold
const AUTO_BLOCK_THRESHOLD = 80;
const DEFAULT_BLOCK_DURATION_HOURS = 24;

/**
 * Bot detection middleware
 * Tracks all requests and calculates bot scores
 * Blocks WordPress scanner traffic
 * Auto-blocks high-risk IPs (score >= 80) for 24 hours with escalation
 */
export async function botDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || null;
  const user = (req as any).user;
  const userId = user?.claims?.sub || null;
  const sessionId = req.sessionID || null;

  // Check if IP is already blocked
  try {
    const isBlocked = await storage.isIpBlocked(ip);
    if (isBlocked) {
      // Log the blocked request
      storage.createRequestAnalytics({
        ipAddress: ip,
        userAgent,
        method: req.method,
        path: req.path,
        statusCode: 403,
        userId,
        sessionId,
        headers: req.headers as any,
        botScore: 100,
        botFlags: ["ip_blocked"],
        responseTimeMs: Date.now() - startTime,
      }).catch((error) => {
        console.error("Error tracking blocked IP request:", error);
      });
      
      // Return 403 Forbidden for blocked IPs
      return res.status(403).send("Access Denied");
    }
  } catch (error) {
    // Don't break the request if block check fails
    console.error("Error checking IP block status:", error);
  }

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

  // Auto-block high-risk IPs (score >= 80)
  if (score >= AUTO_BLOCK_THRESHOLD) {
    const reason = flags.length > 0 ? flags.join(", ") : "high_bot_score";
    
    // Block asynchronously - don't wait for it
    storage.blockIp(ip, reason, score, DEFAULT_BLOCK_DURATION_HOURS).then((blocked) => {
      console.log(`Auto-blocked IP ${ip} for ${DEFAULT_BLOCK_DURATION_HOURS * Math.pow(2, blocked.blockCount - 1)}h (score: ${score}, reason: ${reason}, offense #${blocked.blockCount})`);
    }).catch((error) => {
      console.error("Error auto-blocking IP:", error);
    });
  }

  // Block WordPress scanner traffic (return 404 to waste their time)
  if (flags.includes("wordpress_scanner")) {
    const responseTimeMs = Date.now() - startTime;
    
    // Log the blocked request
    storage.createRequestAnalytics({
      ipAddress: ip,
      userAgent,
      method: req.method,
      path: req.path,
      statusCode: 404,
      userId,
      sessionId,
      headers: req.headers as any,
      botScore: score,
      botFlags: flags.length > 0 ? flags : null,
      responseTimeMs,
    }).catch((error) => {
      console.error("Error tracking blocked WordPress scanner:", error);
    });
    
    // Return 404 to make it look like the site doesn't exist
    return res.status(404).send("Not Found");
  }

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
