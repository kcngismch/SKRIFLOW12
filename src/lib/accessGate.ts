import { VALID_ACCESS_HASHES } from "@/config/accessCodes";

export const PASS_STORAGE_KEY = "skriflow_pass";

export interface PassRecord {
  hash: string;
  activatedAt: string;
}

// In-memory fallback for Node test environment or restricted localStorage
const memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage[key] ?? null;
    }
  }
  return memoryStorage[key] ?? null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      window.dispatchEvent(new Event("skriflow_pass_update"));
      return;
    } catch {
      // Fallback to memory
    }
  }
  memoryStorage[key] = value;
}

function removeStorageItem(key: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
      window.dispatchEvent(new Event("skriflow_pass_update"));
      return;
    } catch {
      // Fallback to memory
    }
  }
  delete memoryStorage[key];
}

const FNV_OFFSET_BASIS_64 = 14695981039346656037n;
const FNV_PRIME_64 = 1099511628211n;
const MASK_64 = 0xffffffffffffffffn;

/**
 * Menghitung hash FNV-1a 64-bit (hex lowercase 16 karakter) dari kode akses.
 * Kode di-trim dan di-normalize ke UPPERCASE (format SKRIFLOW-XXXX-XXXX).
 * Pure JS (BigInt), aman berjalan di insecure context (HTTP).
 */
export function hashCode(code: string): string {
  const normalized = (code || "").trim().toUpperCase();
  const bytes = new TextEncoder().encode(normalized);
  let hash = FNV_OFFSET_BASIS_64;

  for (let i = 0; i < bytes.length; i++) {
    hash ^= BigInt(bytes[i]);
    hash = (hash * FNV_PRIME_64) & MASK_64;
  }

  return hash.toString(16).padStart(16, "0");
}

/**
 * Validasi apakah string snapshot JSON merepresentasikan pass yang valid.
 */
export function isPassActiveFromRaw(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return false;
    }
    if (typeof parsed.hash !== "string") {
      return false;
    }
    return VALID_ACCESS_HASHES.includes(parsed.hash.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Cek sinkron apakah Skriflow Pass saat ini aktif di storage.
 */
export function isPassActiveSync(): boolean {
  return isPassActiveFromRaw(getStorageItem(PASS_STORAGE_KEY));
}

/**
 * Cek localStorage skriflow_pass {hash, activatedAt}; valid = hash ada di daftar valid.
 */
export async function isPassActive(): Promise<boolean> {
  return isPassActiveSync();
}

/**
 * Hash kode, cocokkan dengan daftar hash valid di config, simpan ke localStorage jika valid.
 * Mengembalikan true jika kode valid dan berhasil diaktifkan, false jika salah/tidak terdaftar.
 */
export async function activatePass(code: string): Promise<boolean> {
  if (!code || typeof code !== "string" || !code.trim()) {
    return false;
  }

  try {
    const hash = hashCode(code);
    if (VALID_ACCESS_HASHES.includes(hash)) {
      const record: PassRecord = {
        hash,
        activatedAt: new Date().toISOString(),
      };
      setStorageItem(PASS_STORAGE_KEY, JSON.stringify(record));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Menghapus pass dari storage (untuk testing / debug).
 */
export function deactivatePass(): void {
  removeStorageItem(PASS_STORAGE_KEY);
}

/**
 * Snapshot untuk useSyncExternalStore.
 */
export function getPassSnapshot(): string {
  return getStorageItem(PASS_STORAGE_KEY) || "";
}

/**
 * Subscribe handler untuk perubahan pass antar tab dan di dalam window.
 */
export function subscribeToPass(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("skriflow_pass_update", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("skriflow_pass_update", handler);
  };
}
