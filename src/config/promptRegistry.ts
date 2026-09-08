import { NOTEBOOKLM_LIMITS } from "./promptLimits";

export interface PromptManifest {
  id: string;
  toolSlug: string;
  targetPlatform: "NotebookLM" | "ChatGPT / Gemini";
  description: string;
  staticBudget: number;
  dynamicBudget: number;
  safeTarget: number;
  hardLimit: number;
  fieldBudgets?: Record<string, number>;
}

export const PROMPT_REGISTRY: Record<string, PromptManifest> = {
  "literature-source-search-a": {
    id: "literature-source-search-a",
    toolSlug: "cari-literatur-awal",
    targetPlatform: "NotebookLM",
    description: "Cari dan masukkan sumber akademik individual untuk NotebookLM",
    staticBudget: 1525,
    dynamicBudget: 1975,
    safeTarget: NOTEBOOKLM_LIMITS.safeTarget,
    hardLimit: NOTEBOOKLM_LIMITS.hardLimit,
    fieldBudgets: {
      prodi: 100,
      area_eksplorasi: 350,
      fenomena_awal: 800,
      prioritas_sumber: 250,
      rentang_tahun: 100,
      kata_kunci: 200,
      fokus_aspek: 250,
      hal_terbuka: 150,
    },
  },
  "literature-synthesis-b": {
    id: "literature-synthesis-b",
    toolSlug: "cari-literatur-awal",
    targetPlatform: "NotebookLM",
    description: "Pembuat Paket Bukti Literatur dari sumber notebook untuk mahasiswa S1",
    staticBudget: 1788,
    dynamicBudget: 1712,
    safeTarget: NOTEBOOKLM_LIMITS.safeTarget,
    hardLimit: NOTEBOOKLM_LIMITS.hardLimit,
    fieldBudgets: {
      prodi: 100,
      area_eksplorasi: 350,
      fenomena_awal: 800,
      fokus_aspek: 500,
      hal_terbuka: 250,
    },
  },
};

// Validate registry invariant at initialization time: staticBudget + dynamicBudget <= safeTarget
for (const manifest of Object.values(PROMPT_REGISTRY)) {
  if (manifest.targetPlatform === "NotebookLM") {
    if (manifest.staticBudget + manifest.dynamicBudget > manifest.safeTarget) {
      throw new Error(
        `Invariant violation in prompt manifest '${manifest.id}': staticBudget (${manifest.staticBudget}) + dynamicBudget (${manifest.dynamicBudget}) > safeTarget (${manifest.safeTarget})`
      );
    }
  }
}

/**
 * Retrieves a prompt manifest from the registry.
 * - In development, throws an explicit Error if an unregistered NotebookLM prompt is requested.
 * - In production, returns null so the UI can safely disable actions and display a configuration error.
 */
export function getPromptManifest(promptId: string): PromptManifest | null {
  const manifest = PROMPT_REGISTRY[promptId];
  if (!manifest) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(`Unregistered prompt manifest ID: '${promptId}'`);
    }
    return null;
  }
  return manifest;
}
