export const PLATFORM_URLS = {
  chatgpt: "https://chatgpt.com/",
  gemini: "https://gemini.google.com/app",
  notebooklm: "https://notebooklm.google.com/",
} as const;

/**
 * Safely copies text to the system clipboard.
 * Supports Modern Clipboard API with legacy textarea fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof window === "undefined") {
    return false;
  }

  // 1. Try Modern Clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to fallback
    }
  }

  // 2. Fallback using invisible textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Opens a platform URL in a new tab securely without leaking parameters.
 */
export function openPlatformUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  const newTab = window.open(url, "_blank", "noopener,noreferrer");
  return !!newTab;
}

/**
 * Reusable helper to copy prompt to clipboard and open the platform URL.
 * Never appends prompt or user data to the URL.
 */
export async function copyPromptAndOpenPlatform(
  prompt: string,
  url: string
): Promise<{ success: boolean; opened: boolean }> {
  const copied = await copyToClipboard(prompt);
  if (copied) {
    openPlatformUrl(url);
    return { success: true, opened: true };
  }
  return { success: false, opened: false };
}
