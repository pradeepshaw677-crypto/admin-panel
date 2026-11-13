/**
 * Cloudinary media utility.
 * Uploads are authorised and signed by the backend. No API secret ever reaches
 * the browser, and the backend re-validates file type and size before upload.
 */

export const CLOUDINARY_CLOUD_NAME = "apnabazar-cdn";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function getCloudinaryUrl(
  urlOrPublicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "scale" | "thumb" | "limit";
    quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | number;
    format?: "auto" | "webp" | "avif" | "jpg";
  } = {}
): string {
  if (!urlOrPublicId) return "";

  const {
    width = 800,
    height,
    crop = "limit",
    quality = "auto:good",
    format = "auto",
  } = options;

  if (urlOrPublicId.includes("res.cloudinary.com")) {
    const parts = urlOrPublicId.split("/upload/");
    if (parts.length === 2) {
      const transform = `f_${format},q_${quality},w_${width}${height ? `,h_${height}` : ""},c_${crop}`;
      return `${parts[0]}/upload/${transform}/${parts[1]}`;
    }
    return urlOrPublicId;
  }

  if (urlOrPublicId.startsWith("http://") || urlOrPublicId.startsWith("https://")) {
    // External origins are proxied by the backend only when Cloudinary Fetch is
    // configured. Never route customer traffic through Cloudinary's public demo account.
    return urlOrPublicId;
  }

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_${format},q_${quality},w_${width}${
    height ? `,h_${height}` : ""
  },c_${crop}/${urlOrPublicId}`;
}

const IMAGE_FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="#f8fafc"/><rect x="24" y="24" width="552" height="552" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/><circle cx="300" cy="250" r="56" fill="#fef3c7"/><path d="M280 250 L320 250 M300 230 L300 270" stroke="#d97706" stroke-width="5" stroke-linecap="round"/><text x="300" y="350" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="26" fill="#0f172a">Apna Bazar</text><text x="300" y="385" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="14" fill="#d97706">100% Genuine Branded Quality</text></svg>',
  );

/**
 * If an image fails, restore the original origin URL once or fall back
 * to an inline pristine branded placeholder. Prevents broken image icons anywhere.
 */
export function recoverImage(img: HTMLImageElement): void {
  if (img.dataset.recoveryDone === "1") return;

  const source = img.currentSrc || img.src || "";
  const marker = "/image/fetch/";
  const markerIndex = source.indexOf(marker);
  if (markerIndex >= 0) {
    const remainder = source.slice(markerIndex + marker.length);
    const slashIndex = remainder.indexOf("/");
    const encoded = slashIndex >= 0 ? remainder.slice(slashIndex + 1) : "";
    try {
      const original = decodeURIComponent(encoded);
      if (/^https?:\/\//i.test(original) && original !== source) {
        img.dataset.recoveryDone = "1";
        img.src = original;
        return;
      }
    } catch {
      /* fall through to placeholder */
    }
  }

  img.dataset.recoveryDone = "1";
  img.src = IMAGE_FALLBACK;
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.error === "string" ? data.error : "Upload failed.";
  } catch {
    return "Upload failed.";
  }
}

export async function getSignedUploadParams(folder: string = "reviews"): Promise<{
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  maxFileSize: number;
}> {
  const response = await fetch("/api/v1/upload/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ folder }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function uploadToCloudinary(
  fileOrBase64: File | string,
  folder: string = "reviews"
): Promise<{ url: string; publicId: string }> {
  if (fileOrBase64 instanceof File) {
    if (!ALLOWED_FILE_TYPES.includes(fileOrBase64.type)) {
      throw new Error("Only JPEG, PNG or WebP images are allowed.");
    }
    if (fileOrBase64.size > MAX_UPLOAD_BYTES) {
      throw new Error("Image must be smaller than 5 MB.");
    }
  }

  const signData = await getSignedUploadParams(folder);
  const base64Data = fileOrBase64 instanceof File ? await fileToBase64(fileOrBase64) : fileOrBase64;

  if (!base64Data.startsWith("data:image/")) {
    throw new Error("Invalid image data.");
  }

  const response = await fetch("/api/v1/upload/image", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({
      data: base64Data,
      folder: signData.folder,
      timestamp: signData.timestamp,
      signature: signData.signature,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id || "",
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
  });
}

/**
 * Returns optimized Cloudinary URL if Cloudinary is configured,
 * otherwise returns the high-speed local asset path with instant caching.
 */
export function getBrandOrAssetUrl(localAssetPath: string, publicIdOrBrand?: string): string {
  if (!localAssetPath) return "";
  // If remote Cloudinary URL is provided, return transformed Cloudinary URL
  if (localAssetPath.startsWith("http://") || localAssetPath.startsWith("https://")) {
    return getCloudinaryUrl(localAssetPath, { width: 400, format: "auto", quality: "auto" });
  }
  // If Cloudinary cloud name is available and an ID is passed
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_CLOUD_NAME !== "apnabazar-cdn" && publicIdOrBrand) {
    return getCloudinaryUrl(`brand_logos/${publicIdOrBrand}`, {
      width: 400,
      format: "auto",
      quality: "auto",
    });
  }
  return localAssetPath;
}

