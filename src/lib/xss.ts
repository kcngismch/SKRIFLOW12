"use strict";
/**
 * Shared URL safety gate used by all <a href> that render URL from parser output.
 * pony tail: sanitizer minimal — cukup untuk kondisi sekarang.
 * Jika butuh sanitasi HTML penuh (upload gambar, dll), paketkan DOMPurify.
 */
const UNSAFE_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:", "blob:", "about:"];

/**
 * Returns a *safe* href for rendering, or null if the URL must NOT be rendered as a link.
 * Rejects non-HTTP(S) and unsafe protocols; also rejects scheme-agnostic tricks
 * like `java\tscript:` after whitespace stripping.
 */
export function safeHref(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return null;

  const lower = trimmed.toLowerCase();
  for (const proto of UNSAFE_PROTOCOLS) {
    if (lower.startsWith(proto)) return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || url.hostname.includes("..")) return null;
    return trimmed;
  } catch {
    return null;
  }
}
