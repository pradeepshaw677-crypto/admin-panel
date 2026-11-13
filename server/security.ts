import "dotenv/config";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";

/**
 * Hosting panels often do not set NODE_ENV. The compiled server bundle is only
 * produced by `npm run build` and started with `npm start`, so its entry file
 * is a reliable production signal; `npm run dev` runs server.ts through tsx.
 */
const entryScript = (process.argv[1] || "").replace(/\\/g, "/").toLowerCase();
const compiledEntry = /\/server\.c?js$/.test(entryScript);

export const isProduction =
  process.env.NODE_ENV === "production" ||
  (process.env.NODE_ENV !== "development" && compiledEntry);

/* ------------------------------------------------------------------ */
/* Secrets                                                             */
/* ------------------------------------------------------------------ */

/**
 * Secrets must never have a hardcoded fallback: a public default secret lets
 * anybody forge session tokens. If the deployment forgets to configure one we
 * generate a strong per-process secret instead of silently using a public value.
 */
export function loadSecret(name: string, aliases: string[] = []): string {
  const raw = [name, ...aliases]
    .map((key) => process.env[key])
    .find((value) => typeof value === "string" && value.trim().length > 0);

  if (raw && raw.length >= 32) return raw;

  if (raw) {
    console.error(
      `[security] ${name} is shorter than 32 characters. Configuration must be rejected; using an ephemeral secret.`,
    );
  } else {
    console.error(
      `[security] ${name} is not configured. Generated an ephemeral secret. Set it in the hosting environment so sessions survive restarts.`,
    );
  }

  return crypto.randomBytes(48).toString("base64url");
}

/* ------------------------------------------------------------------ */
/* Security headers                                                    */
/* ------------------------------------------------------------------ */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self' https://*.google.com https://*.run.app https://aistudio.google.com https://*.googleusercontent.com",
  "form-action 'self'",
  "script-src 'self' https://accounts.google.com https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://unpkg.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://mt0.google.com https://mt1.google.com https://mt2.google.com https://mt3.google.com https://ssl.gstatic.com https://www.gstatic.com https://images.higgs.ai https://d8j0ntlcm91z4.cloudfront.net https://pradeepshaw677-crypto.github.io https://*.github.io",
  "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://pradeepshaw677-crypto.github.io https://images.higgs.ai https://d8j0ntlcm91z4.cloudfront.net https://api.bigdatacloud.net https://nominatim.openstreetmap.org https://ipwho.is https://get.geojs.io",
  "frame-src 'self' https://accounts.google.com https://pradeepshaw677-crypto.github.io https://*.github.io https://maps.google.com https://www.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' https://pradeepshaw677-crypto.github.io",
];

const SCRAPER_UA_REGEX =
  /\b(httrack|webcopier|teleport|sitesucker|webzip|webstripper|cyotekwebcopy|offline explorer|blackwidow|nikto|sqlmap)\b/i;

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const ua = String(req.headers["user-agent"] || "");
  if (ua && SCRAPER_UA_REGEX.test(ua)) {
    res.status(403).send("Access Denied");
    return;
  }

  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // X-Frame-Options DENY is omitted so the applet can render inside AI Studio's preview iframe
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-DNS-Prefetch-Control", "on");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(), usb=(), geolocation=*, interest-cohort=()",
  );
  res.setHeader("Origin-Agent-Cluster", "?1");

  const directives = [...CSP_DIRECTIVES];
  if (isProduction) {
    directives.push("upgrade-insecure-requests");
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  } else {
    // Vite's dev client and React refresh need inline/eval and a websocket.
    directives[5] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://unpkg.com";
    directives[9] += " ws: wss:";
  }

  res.setHeader("Content-Security-Policy", directives.join("; "));
  next();
}

/* ------------------------------------------------------------------ */
/* CSRF / origin guard                                                 */
/* ------------------------------------------------------------------ */

const configuredOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => /^[a-z]+:\/\//i.test(origin)),
);

function requestHosts(req: Request): string[] {
  const values = [req.get("x-forwarded-host"), req.get("host")]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(values));
}

function isTrustedOrigin(req: Request, origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  if (configuredOrigins.has(normalized)) return true;
  try {
    const parsed = new URL(normalized);
    return requestHosts(req).includes(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * SameSite=Strict cookies are the primary CSRF defence. This guard adds a
 * second layer: browsers report the request site, and cross-site writes are
 * rejected outright. Non-browser clients (curl, server-to-server) are allowed
 * because they cannot carry a victim's ambient cookie.
 */
export function originGuard(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const fetchSite = req.get("sec-fetch-site");
  if (fetchSite) {
    if (fetchSite !== "same-origin" && fetchSite !== "same-site" && fetchSite !== "none") {
      res.status(403).json({ error: "Cross-site request blocked." });
      return;
    }
  }

  const origin = req.get("origin");
  if (origin && !fetchSite && !isTrustedOrigin(req, origin)) {
    res.status(403).json({ error: "Request origin is not allowed." });
    return;
  }

  next();
}

/* ------------------------------------------------------------------ */
/* Body parsing & payload checks                                       */
/* ------------------------------------------------------------------ */

const smallJson = express.json({ limit: "128kb", strict: true, type: ["application/json"] });

export function selectiveJsonParser(req: Request, res: Response, next: NextFunction): void {
  const isUpload = req.path.startsWith("/api/v1/upload/") || req.path === "/api/cloudinary/upload";
  if (isUpload) return next();
  smallJson(req, res, next);
}

export function requireJson(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  if (req.path.startsWith("/api/v1/upload/") || req.path === "/api/cloudinary/upload") return next();

  const contentLength = Number(req.get("content-length") || 0);
  if (contentLength === 0) return next();

  if (!req.is("application/json")) {
    res.status(415).json({ error: "Content-Type must be application/json." });
    return;
  }
  next();
}

function hasUnsafeKey(value: unknown, depth: number): boolean {
  if (depth > 12) return true;
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    if (value.length > 2000) return true;
    return value.some((entry) => hasUnsafeKey(entry, depth + 1));
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return true;
    if (hasUnsafeKey(child, depth + 1)) return true;
  }
  return false;
}

export function prototypePollutionGuard(req: Request, res: Response, next: NextFunction): void {
  if (req.body && hasUnsafeKey(req.body, 0)) {
    res.status(400).json({ error: "Malformed request payload." });
    return;
  }
  next();
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
sweeper.unref?.();

export function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix: string;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (buckets.size > 100_000) {
      const now = Date.now();
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
    }

    const identity = options.keyGenerator ? options.keyGenerator(req) : clientIp(req);
    const key = `${options.prefix}:${identity}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader("RateLimit-Limit", String(options.max));
      res.setHeader("RateLimit-Remaining", String(Math.max(0, options.max - 1)));
      res.setHeader("RateLimit-Reset", String(Math.ceil((now + options.windowMs) / 1000)));
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.setHeader("RateLimit-Limit", String(options.max));
      res.setHeader("RateLimit-Remaining", "0");
      res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
      res.status(429).json({
        error: options.message || "Too many requests. Please slow down and try again later.",
      });
      return;
    }

    res.setHeader("RateLimit-Limit", String(options.max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, options.max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    next();
  };
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(
  value: unknown,
  options: { min?: number; max?: number; allowEmpty?: boolean } = {},
): string | null {
  if (typeof value !== "string") return null;
  const { min = 0, max = 500, allowEmpty = false } = options;
  const cleaned = value.normalize("NFKC").replace(CONTROL_CHARS, "").replace(/[<>]/g, "").trim();
  if (!cleaned && (allowEmpty || min === 0)) return "";
  if (cleaned.length < min || cleaned.length > max) return null;
  return cleaned;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function isValidPincode(value: unknown): boolean {
  return typeof value === "string" && /^[1-9]\d{5}$/.test(value.trim());
}

export function safeId(value: unknown, maxLength = 80): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(trimmed) ? trimmed : null;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isHttpsUrl(value: unknown, allowedHosts?: string[]): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    if (allowedHosts && !allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `***${digits.slice(-4)}` : "***";
}

export function hashForLog(value: string): string {
  return crypto.createHash("sha256").update(`log:${value}`).digest("hex").slice(0, 24);
}

export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString("base64url")}`;
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");
  next();
}

export function securityErrorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  const candidate = error as { type?: string; status?: number; message?: string };
  if (candidate?.type === "entity.too.large") {
    res.status(413).json({ error: "Request payload is too large." });
    return;
  }
  if (candidate?.type === "entity.parse.failed" || candidate instanceof SyntaxError) {
    res.status(400).json({ error: "Invalid JSON payload." });
    return;
  }

  console.error(
    `[error] ${req.method} ${req.path} ->`,
    candidate?.message ? String(candidate.message).slice(0, 300) : "unknown error",
  );

  res.status(500).json({ error: "Something went wrong. Please try again." });
}
