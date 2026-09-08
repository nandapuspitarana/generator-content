/**
 * URL Guard & SSRF Protection Utility
 * Prevents Server-Side Request Forgery (SSRF) by validating URLs and rejecting
 * requests to loopback, link-local, private internal networks, and cloud metadata services.
 */

export function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();

  // Standard loopback and local hostnames
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower === "[::1]" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local")
  ) {
    return true;
  }

  // Cloud metadata services (AWS, GCP, Azure, OpenStack, etc.)
  if (
    lower === "169.254.169.254" ||
    lower === "metadata.google.internal" ||
    lower === "metadata.google" ||
    lower === "100.100.100.200" || // Alibaba Cloud metadata
    lower.startsWith("169.254.")
  ) {
    return true;
  }

  // IPv4 Loopback range: 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }

  // Private IPv4 ranges (RFC 1918)
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }

  // CGNAT range: 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
  if (/^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }

  // IPv6 Unique Local (fc00::/7) or Link-local (fe80::/10)
  if (/^f[cd][0-9a-f]{2}:/i.test(lower) || /^fe[89ab][0-9a-f]:/i.test(lower)) {
    return true;
  }

  return false;
}

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  url?: URL;
}

/**
 * Validates that a given URL string uses HTTP/HTTPS and does not target private or internal hosts.
 */
export function validateSafeUrl(urlString: string): UrlValidationResult {
  if (!urlString || typeof urlString !== "string") {
    return { isValid: false, error: "Missing or invalid URL string." };
  }

  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: `Invalid protocol: ${parsed.protocol}. Only http and https are allowed.` };
    }

    if (isPrivateIpOrHost(parsed.hostname)) {
      return { isValid: false, error: "Access to private or internal addresses is forbidden." };
    }

    return { isValid: true, url: parsed };
  } catch {
    return { isValid: false, error: "Malformed URL format." };
  }
}

/**
 * Safely fetches a remote image with SSRF checks, timeout, and max size constraints.
 */
export async function fetchSafeImage(
  imageUrl: string,
  maxSizeBytes: number = 5 * 1024 * 1024,
  timeoutMs: number = 8000
): Promise<{ buffer: Buffer; contentType: string }> {
  const validation = validateSafeUrl(imageUrl);
  if (!validation.isValid || !validation.url) {
    throw new Error(validation.error || "Unsafe URL blocked by security policy.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AsikReview-MediaClient/2.0",
        Accept: "image/*",
      },
    });

    if (!res.ok) {
      throw new Error(`Remote server responded with HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (
      !contentType.startsWith("image/") &&
      !contentType.startsWith("application/octet-stream")
    ) {
      throw new Error(`Remote resource is not an image (content-type: ${contentType})`);
    }

    // Check Content-Length header if available before reading body
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`Image size exceeds maximum limit of ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > maxSizeBytes) {
      throw new Error(`Image size exceeds maximum limit of ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: contentType || "image/jpeg",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
