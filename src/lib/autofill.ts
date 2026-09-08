import {
  loadToolData,
  loadSelectedPhenomenon,
  loadSelectedExplorationArea,
  loadIdeaToPhenomenonHandoff,
  loadSharedResearchContext,
} from "./storage";
import { resolveOptionLabel } from "@/data/researchOptions";
import { SelectedExplorationAreaV3 } from "@/types/tool";
import { RESEARCH_FIELD_LIMITS } from "@/config/researchFieldLimits";
import { validateResearchHandoff, HandoffValidationResult } from "./handoffValidator";

export interface AutofillPreviewItem {
  fieldId: string;
  fieldLabel: string;
  currentValue: string;
  currentDisplay: string;
  newValue: string;
  newDisplay: string;
}

export interface LegacyContextItem {
  key: string;
  label: string;
  value: string;
}

export interface AutofillResult {
  hasData: boolean;
  sourceToolSlug: string;
  sourceToolName: string;
  data: Record<string, string>;
  previewItems: AutofillPreviewItem[];
  legacyItems: LegacyContextItem[];
  validationResult?: HandoffValidationResult;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  prodi: "Program Studi / Jurusan",
  area_eksplorasi: "Area Eksplorasi yang Dipilih",
  objek_awal: "Objek atau Kelompok yang Terbayang",
  petunjuk_fenomena: "Petunjuk Fenomena Awal",
  fenomena_awal: "Fenomena Awal Terpilih",
  status_fenomena: "Status Fenomena",
  pendekatan: "Pendekatan yang Lebih Disukai",
  preferensi_data: "Data yang Lebih Nyaman Digunakan",
  akses_data: "Akses Data yang Sudah Dimiliki",
  akses_data_catatan: "Catatan Akses Data",
  avoidances: "Hal yang Ingin Dihindari",
  target_waktu: "Kondisi Waktu Pengerjaan",
  supervisor_direction: "Arahan Dosen",
  arahan_dosen: "Arahan Dosen",
  kata_kunci: "Kata Kunci Khusus",
  hal_terbuka: "Hal yang Masih Belum Ditentukan",
  constraint: "Preferensi dan Batasan",
  prioritas_sumber: "Prioritas Sumber Literatur",
};

/**
 * Formats keywords by combining ID & EN keywords, deduplicating, and fitting cleanly into max length.
 */
function formatCompactKeywords(kwId: string[] = [], kwEn: string[] = []): string {
  const seen = new Set<string>();
  const combined: string[] = [];

  const takeId = kwId.slice(0, 10);
  for (const k of takeId) {
    const trimmed = (k || "").trim();
    const lower = trimmed.toLowerCase();
    if (trimmed && !seen.has(lower)) {
      seen.add(lower);
      combined.push(trimmed);
    }
  }

  const takeEn = kwEn.slice(0, 10);
  for (const k of takeEn) {
    const trimmed = (k || "").trim();
    const lower = trimmed.toLowerCase();
    if (trimmed && !seen.has(lower)) {
      seen.add(lower);
      combined.push(trimmed);
    }
  }

  const result: string[] = [];
  let currentLength = 0;
  for (const kw of combined) {
    const addition = result.length === 0 ? kw.length : kw.length + 2;
    if (currentLength + addition <= RESEARCH_FIELD_LIMITS.literatureKeywords) {
      result.push(kw);
      currentLength += addition;
    } else {
      break;
    }
  }
  return result.join("; ");
}

/**
 * Formats unresolved items cleanly fitting into max length.
 */
function formatCompactUnresolved(items: string[] = []): string {
  const take = items.slice(0, 10);
  const result: string[] = [];
  let currentLength = 0;
  for (const item of take) {
    const trimmed = (item || "").trim();
    if (!trimmed) continue;
    const addition = result.length === 0 ? trimmed.length : trimmed.length + 2;
    if (currentLength + addition <= RESEARCH_FIELD_LIMITS.unresolvedLiteratureItems) {
      result.push(trimmed);
      currentLength += addition;
    } else {
      break;
    }
  }
  return result.join("; ");
}

/**
 * Gets autofill data for a target tool from its predecessor tool.
 */
export function getAutofillForTool(
  targetSlug: string,
  currentValues: Record<string, string> = {}
): AutofillResult {
  let sourceSlug = "";
  let sourceName = "";
  let allowedFields: string[] = [];
  let disallowedFields: string[] = [];

  const selectedExplorationArea = loadSelectedExplorationArea();
  const ideaHandoff = loadIdeaToPhenomenonHandoff();
  const selectedPhenomenon = loadSelectedPhenomenon();
  const sharedContext = loadSharedResearchContext();
  const t2Data = loadToolData("cari-fenomena-awal");
  const t1Data = loadToolData("cari-ide-skripsi");

  if (targetSlug === "cari-fenomena-awal" || targetSlug === "cari-validasi-fenomena") {
    sourceSlug = "cari-ide-skripsi";
    sourceName = "Cari Ide Skripsi";
    allowedFields = [
      "prodi",
      "area_eksplorasi",
      "objek_awal",
      "petunjuk_fenomena",
      "pendekatan",
      "preferensi_data",
      "akses_data",
      "akses_data_catatan",
      "avoidances",
      "target_waktu",
      "supervisor_direction",
      "arahan_dosen",
    ];
    disallowedFields = ["cakupan_fenomena", "rentang_fenomena", "fenomena_awal"];
  } else if (targetSlug === "cari-literatur-awal") {
    sourceSlug = "cari-fenomena-awal";
    sourceName = "Cari & Validasi Fenomena";
    allowedFields = [
      "prodi",
      "area_eksplorasi",
      "fenomena_awal",
      "status_fenomena",
      "pendekatan",
      "preferensi_data",
      "akses_data",
      "akses_data_catatan",
      "avoidances",
      "target_waktu",
      "supervisor_direction",
      "arahan_dosen",
      "kata_kunci",
      "hal_terbuka",
    ];
    disallowedFields = [];
  } else if (targetSlug === "bedah-hasil-notebooklm") {
    sourceSlug = "cari-literatur-awal";
    sourceName = "Cari Literatur Awal";
    allowedFields = ["fenomena_awal", "supervisor_direction", "arahan_dosen", "constraint"];
    disallowedFields = ["output_notebooklm"];
  }

  if (!sourceSlug) {
    return { hasData: false, sourceToolSlug: "", sourceToolName: "", data: {}, previewItems: [], legacyItems: [] };
  }

  // Combine source data prioritizing the most recent direct predecessor
  let sourceData: Record<string, string> = {};

  if (targetSlug === "cari-literatur-awal") {
    sourceData = {
      prodi: sharedContext?.prodi || t2Data.prodi || t1Data.prodi || t1Data.programStudi || "",
      area_eksplorasi: sharedContext?.selectedArea || sharedContext?.area_eksplorasi || t2Data.area_eksplorasi || "",
      fenomena_awal: selectedPhenomenon?.phenomenonSummary || sharedContext?.fenomena_ringkas || "",
      status_fenomena: selectedPhenomenon?.status || sharedContext?.fenomena_status || "",
      pendekatan: sharedContext?.constraints?.pendekatan || t2Data.pendekatan || t1Data.pendekatan || "",
      preferensi_data: sharedContext?.constraints?.dataNyaman || t2Data.preferensi_data || t1Data.preferensi_data || t1Data.jenisData || "",
      akses_data: sharedContext?.constraints?.aksesData || t2Data.akses_data || t1Data.akses_data || "",
      akses_data_catatan: sharedContext?.constraints?.catatanAkses || t2Data.akses_data_catatan || t1Data.akses_data_catatan || "",
      avoidances: sharedContext?.constraints?.halDihindari || t2Data.avoidances || t1Data.avoidances || t1Data.kondisiBatasan || "",
      target_waktu: sharedContext?.constraints?.kondisiWaktu || t2Data.target_waktu || t1Data.target_waktu || "",
      supervisor_direction: sharedContext?.constraints?.arahanDosen || t2Data.arahan_dosen || t1Data.supervisor_direction || t1Data.arahan_dosen || "",
      arahan_dosen: sharedContext?.constraints?.arahanDosen || t2Data.arahan_dosen || t1Data.supervisor_direction || t1Data.arahan_dosen || "",
    };

    if (selectedPhenomenon) {
      if (selectedPhenomenon.phenomenonSummary) {
        sourceData.fenomena_awal = selectedPhenomenon.phenomenonSummary.trim();
      }
      const kw = formatCompactKeywords(
        selectedPhenomenon.keywordsId || [],
        selectedPhenomenon.keywordsEn || []
      );
      if (kw) {
        sourceData.kata_kunci = kw;
      }
      const unres = formatCompactUnresolved(selectedPhenomenon.unresolvedItems || []);
      if (unres) {
        sourceData.hal_terbuka = unres;
      }
    }
  } else if (targetSlug === "cari-fenomena-awal" || targetSlug === "cari-validasi-fenomena") {
    // Exact mapping from IdeaToPhenomenonHandoff / SelectedExplorationArea
    const prodi = (
      ideaHandoff?.prodi ||
      sharedContext?.prodi ||
      t1Data.prodi ||
      t1Data.programStudi ||
      ""
    ).trim();

    const areaText = (
      ideaHandoff?.areaText ||
      selectedExplorationArea?.handoffToPhenomenon?.areaText ||
      selectedExplorationArea?.scopeSummary ||
      ""
    ).trim();

    const v3Handoff =
      selectedExplorationArea?.schemaVersion === 3
        ? (selectedExplorationArea as SelectedExplorationAreaV3).handoffToPhenomenon
        : null;

    const actorText = (
      ideaHandoff?.researchContext?.actorText ||
      v3Handoff?.actorText ||
      (selectedExplorationArea?.schemaVersion === 3
        ? (selectedExplorationArea as SelectedExplorationAreaV3).researchContext?.potentialActors?.join(", ")
        : "") ||
      ""
    ).trim();

    const entityText = (
      ideaHandoff?.researchContext?.entityText ||
      v3Handoff?.entityText ||
      (selectedExplorationArea?.schemaVersion === 3
        ? (selectedExplorationArea as SelectedExplorationAreaV3).researchContext?.potentialEntities?.join(", ")
        : "") ||
      ""
    ).trim();

    let objectOrGroup = "";
    if (actorText && entityText) {
      objectOrGroup = `Siapa yang berkaitan: ${actorText}. Apa yang diamati: ${entityText}.`;
    } else if (actorText) {
      objectOrGroup = `Siapa yang berkaitan: ${actorText}.`;
    } else if (entityText) {
      objectOrGroup = `Apa yang diamati: ${entityText}.`;
    }

    // Exact fallback order: handoff initialClue -> area initialClue -> phenomenonSearchBrief -> ""
    // FORBIDDEN to fallback to minat / interest / defaultPhenomenonClue
    const initialClue = (
      ideaHandoff?.phenomenonContext?.initialClue ||
      selectedExplorationArea?.handoffToPhenomenon?.initialClue ||
      selectedExplorationArea?.phenomenonSearchBrief ||
      ""
    ).trim();

    const pendekatan = (
      ideaHandoff?.studentConstraints?.preferredApproach ||
      sharedContext?.constraints?.pendekatan ||
      sharedContext?.pendekatan ||
      t1Data.pendekatan ||
      ""
    ).trim();

    const preferensiData = (
      ideaHandoff?.studentConstraints?.preferredData ||
      sharedContext?.constraints?.dataNyaman ||
      sharedContext?.preferensi_data ||
      t1Data.preferensi_data ||
      t1Data.jenisData ||
      ""
    ).trim();

    const aksesData = (
      ideaHandoff?.studentConstraints?.dataAccess ||
      sharedContext?.constraints?.aksesData ||
      sharedContext?.akses_data ||
      t1Data.akses_data ||
      ""
    ).trim();

    const aksesDataCatatan = (
      ideaHandoff?.studentConstraints?.accessNotes ||
      sharedContext?.constraints?.catatanAkses ||
      sharedContext?.akses_data_catatan ||
      t1Data.akses_data_catatan ||
      ""
    ).trim();

    const avoidances = (
      ideaHandoff?.studentConstraints?.thingsToAvoid ||
      sharedContext?.constraints?.halDihindari ||
      sharedContext?.avoidances ||
      t1Data.avoidances ||
      t1Data.kondisiBatasan ||
      ""
    ).trim();

    const targetWaktu = (
      ideaHandoff?.studentConstraints?.timeCondition ||
      sharedContext?.constraints?.kondisiWaktu ||
      sharedContext?.target_waktu ||
      t1Data.target_waktu ||
      ""
    ).trim();

    const lecturerDirection = (
      ideaHandoff?.studentConstraints?.lecturerDirection ||
      sharedContext?.constraints?.arahanDosen ||
      sharedContext?.supervisor_direction ||
      t1Data.supervisor_direction ||
      t1Data.arahan_dosen ||
      ""
    ).trim();

    sourceData = {
      prodi,
      area_eksplorasi: areaText,
      objek_awal: objectOrGroup,
      petunjuk_fenomena: initialClue,
      pendekatan,
      preferensi_data: preferensiData,
      akses_data: aksesData,
      akses_data_catatan: aksesDataCatatan,
      avoidances,
      target_waktu: targetWaktu,
      supervisor_direction: lecturerDirection,
      arahan_dosen: lecturerDirection,
    };
  } else if (targetSlug === "bedah-hasil-notebooklm") {
    const t3Data = loadToolData("cari-literatur-awal");
    sourceData = { ...t1Data, ...t2Data, ...t3Data };
    if (selectedPhenomenon && !sourceData.fenomena_awal) {
      sourceData.fenomena_awal = selectedPhenomenon.phenomenonSummary;
    }
  }

  const data: Record<string, string> = {};
  const previewItems: AutofillPreviewItem[] = [];
  const legacyItems: LegacyContextItem[] = [];

  if (!sourceData || Object.keys(sourceData).length === 0) {
    return { hasData: false, sourceToolSlug: sourceSlug, sourceToolName: sourceName, data: {}, previewItems: [], legacyItems: [] };
  }

  // 1. Direct Compatible 1-to-1 Mapping
  for (const fieldId of allowedFields) {
    if (disallowedFields.includes(fieldId)) continue;
    const rawVal = sourceData[fieldId];
    if (typeof rawVal === "string" && rawVal.trim().length > 0) {
      const trimmed = rawVal.trim();
      data[fieldId] = trimmed;

      const currentVal = (currentValues[fieldId] || "").trim();
      const currentDisplay = currentVal
        ? resolveOptionLabel(fieldId, currentVal)
        : "(Kosong)";
      const newDisplay = resolveOptionLabel(fieldId, trimmed);

      previewItems.push({
        fieldId,
        fieldLabel: FIELD_LABEL_MAP[fieldId] || fieldId,
        currentValue: currentVal,
        currentDisplay,
        newValue: trimmed,
        newDisplay,
      });
    }
  }

  // 2. Special Structured Constraint Summary for Tool 4 (bedah-hasil-notebooklm)
  if (targetSlug === "bedah-hasil-notebooklm") {
    const constraintParts: string[] = [];
    if (sourceData.pendekatan && sourceData.pendekatan !== "unknown" && sourceData.pendekatan !== "Belum tahu") {
      const lbl = resolveOptionLabel("pendekatan", sourceData.pendekatan);
      if (lbl && lbl !== "Belum tahu") constraintParts.push(`Pendekatan: ${lbl}`);
    }
    if (sourceData.preferensi_data && sourceData.preferensi_data !== "unknown" && sourceData.preferensi_data !== "Belum tahu") {
      const lbl = resolveOptionLabel("preferensi_data", sourceData.preferensi_data);
      if (lbl && lbl !== "Belum tahu") constraintParts.push(`Preferensi data: ${lbl}`);
    }
    if (sourceData.avoidances && sourceData.avoidances.trim().length > 0) {
      constraintParts.push(`Hindari: ${sourceData.avoidances.trim()}`);
    }
    if (sourceData.target_waktu && sourceData.target_waktu !== "unknown" && sourceData.target_waktu !== "Belum tahu") {
      const lbl = resolveOptionLabel("target_waktu", sourceData.target_waktu);
      if (lbl && lbl !== "Belum tahu") constraintParts.push(`Waktu: ${lbl}`);
    }

    if (constraintParts.length > 0 && !data.constraint) {
      const combinedConstraint = constraintParts.join("; ");
      data.constraint = combinedConstraint;
      const currentVal = (currentValues.constraint || "").trim();
      previewItems.push({
        fieldId: "constraint",
        fieldLabel: FIELD_LABEL_MAP.constraint,
        currentValue: currentVal,
        currentDisplay: currentVal || "(Kosong)",
        newValue: combinedConstraint,
        newDisplay: combinedConstraint,
      });
    }
  }

  // 3. Backward compatibility mapping for older legacy schema (programStudi -> prodi)
  if (!data.prodi && typeof sourceData.programStudi === "string" && sourceData.programStudi.trim().length > 0) {
    const val = sourceData.programStudi.trim();
    data.prodi = val;
    const currentVal = (currentValues.prodi || "").trim();
    previewItems.push({
      fieldId: "prodi",
      fieldLabel: FIELD_LABEL_MAP.prodi,
      currentValue: currentVal,
      currentDisplay: currentVal || "(Kosong)",
      newValue: val,
      newDisplay: val,
    });
  }

  // 4. Legacy context items (for display only, never auto-selects dropdowns)
  const legacyFieldKeys = [
    { key: "minatTopik", label: "Minat Topik (Lama)" },
    { key: "kondisiBatasan", label: "Batasan / Kondisi (Lama)" },
    { key: "jenisData", label: "Preferensi Data / Metodologi (Lama)" },
    { key: "preferensi", label: "Preferensi (Lama)" },
  ];

  for (const item of legacyFieldKeys) {
    const legacyVal = sourceData[item.key];
    if (typeof legacyVal === "string" && legacyVal.trim().length > 0) {
      legacyItems.push({
        key: item.key,
        label: item.label,
        value: legacyVal.trim(),
      });
    }
  }

  const hasData = previewItems.length > 0;
  const validationResult = validateResearchHandoff(targetSlug, data);
  return { hasData, sourceToolSlug: sourceSlug, sourceToolName: sourceName, data, previewItems, legacyItems, validationResult };
}

/**
 * Backward compatibility alias for Tool 2 / Tool 3
 */
export function getTool1Autofill(currentValues: Record<string, string> = {}): AutofillResult {
  return getAutofillForTool("cari-fenomena-awal", currentValues);
}

/**
 * Applies autofill values to current form values based on mode.
 */
export function applyAutofillValues(
  currentValues: Record<string, string>,
  autofillData: Record<string, string>,
  mode: "fill_empty" | "overwrite"
): Record<string, string> {
  const result = { ...currentValues };

  for (const [key, val] of Object.entries(autofillData)) {
    // Strictly forbid autofilling area_eksplorasi on Tool 2 or fenomena_awal on Tool 3 / output_notebooklm on Tool 4
    if (key === "output_notebooklm") continue;

    if (mode === "overwrite") {
      result[key] = val;
    } else if (mode === "fill_empty") {
      const current = result[key];
      if (!current || current === "unknown" || current.trim().length === 0) {
        result[key] = val;
      }
    }
  }

  return result;
}
