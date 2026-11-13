import crypto from "node:crypto";

/**
 * Catalog & 3D Runway image delivery and upload through the configured Cloudinary account.
 * Production serves optimised WebP/AVIF/PNG via Cloudinary Upload / Fetch.
 * If Cloudinary is not configured, the original CDN URL is returned untouched so the storefront never breaks.
 */

const PARSED_ENV_URL = parseCloudinaryUrl(process.env.CLOUDINARY_URL);

export const CLOUD_NAME = (
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  PARSED_ENV_URL?.cloudName ||
  ""
).trim();

const API_KEY = (
  process.env.CLOUDINARY_API_KEY ||
  PARSED_ENV_URL?.apiKey ||
  ""
).trim();

const API_SECRET = (
  process.env.CLOUDINARY_API_SECRET ||
  PARSED_ENV_URL?.apiSecret ||
  ""
).trim();

/** Accepts the single-variable Cloudinary convention: cloudinary://key:secret@cloud */
export function parseCloudinaryUrl(value?: string): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "cloudinary:") return null;
    const cloudName = parsed.hostname.trim();
    const apiKey = decodeURIComponent(parsed.username || "").trim();
    const apiSecret = decodeURIComponent(parsed.password || "").trim();
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

const FETCH_ENABLED = process.env.CLOUDINARY_FETCH_ENABLED !== "false";

const FETCHABLE_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
]);

export const CLOUDINARY_MEDIA_READY = Boolean(CLOUD_NAME && FETCH_ENABLED);
export const CLOUDINARY_UPLOAD_READY = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

function cloudinaryTransform(width: number): string {
  return `f_auto,q_auto:good,w_${Math.max(64, Math.min(2000, Math.round(width)))},c_limit`;
}

/** Cloudinary transformation segments always contain comma-separated params. */
function isTransformSegment(segment: string): boolean {
  return segment.includes(",") && /^[a-z]{1,4}_/i.test(segment);
}

export function deliverCatalogImage(url: string, width = 800): string {
  if (!url) return "";
  if (!CLOUD_NAME || !FETCH_ENABLED) return url;

  try {
    if (url.includes("/image/fetch/")) {
      const [prefix, remainder] = url.split("/image/fetch/");
      const slash = remainder.indexOf("/");
      const first = slash >= 0 ? remainder.slice(0, slash) : remainder;
      const source = slash >= 0 && isTransformSegment(first) ? remainder.slice(slash + 1) : remainder;
      return `${prefix}/image/fetch/${cloudinaryTransform(width)}/${source}`;
    }

    const parsed = new URL(url);
    if (!FETCHABLE_HOSTS.has(parsed.hostname)) return url;

    if (parsed.hostname === "res.cloudinary.com") {
      const pieces = url.split("/image/upload/");
      if (pieces.length !== 2) return url;
      const slash = pieces[1].indexOf("/");
      const first = slash >= 0 ? pieces[1].slice(0, slash) : "";
      const tail = slash >= 0 && isTransformSegment(first) ? pieces[1].slice(slash + 1) : pieces[1];
      return `${pieces[0]}/image/upload/${cloudinaryTransform(width)}/${tail}`;
    }

    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${cloudinaryTransform(width)}/${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

/**
 * Canonical Cloudinary URL persisted in the database (no width transform).
 * Delivery adds the transform per breakpoint so one row serves every size.
 */
export function canonicalCatalogImage(url: string): string {
  if (!url || !CLOUD_NAME || !FETCH_ENABLED) return url;

  try {
    if (url.includes("/image/fetch/")) return url;
    const parsed = new URL(url);
    if (!FETCHABLE_HOSTS.has(parsed.hostname)) return url;
    if (parsed.hostname === "res.cloudinary.com") return url;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

export function deliverCatalogImages(images: string[] | undefined, width = 800): string[] {
  return (images || []).map((image) => deliverCatalogImage(image, width));
}

/**
 * Uploads a remote PNG/WebP image URL directly to Cloudinary (signed upload)
 * and returns the permanent `https://res.cloudinary.com/.../image/upload/...` URL.
 * Falls back to canonical Cloudinary Fetch URL or original URL if upload credentials are absent.
 */
export async function uploadRemoteImageToCloudinary(
  remoteUrl: string,
  publicId: string,
  folder = "apnabazar_runway_3d"
): Promise<string> {
  if (!remoteUrl) return "";
  if (remoteUrl.includes("res.cloudinary.com") && remoteUrl.includes("/image/upload/")) {
    return remoteUrl;
  }

  if (!CLOUDINARY_UPLOAD_READY) {
    return canonicalCatalogImage(remoteUrl);
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const overwrite = "true";
    const toSign = `folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const body = new URLSearchParams({
      file: remoteUrl,
      folder,
      public_id: publicId,
      overwrite,
      timestamp: String(timestamp),
      api_key: API_KEY,
      signature,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (response.ok) {
      const data = (await response.json()) as { secure_url?: string };
      if (data?.secure_url) {
        return data.secure_url;
      }
    }
  } catch {
    // Fall back gracefully if network/credential error occurs
  }

  return canonicalCatalogImage(remoteUrl);
}
