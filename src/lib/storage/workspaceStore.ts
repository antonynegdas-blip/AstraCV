import {
  DEFAULT_SECTION_ORDER,
  ImprovementItem,
  ResumeData,
} from "@/types/resume";
import {
  ApplicationRecord,
  ApplicationStatus,
  MasterProfile,
  ResumeLayoutConfig,
  WorkspaceBackup,
} from "@/types/workspace";

const MASTER_PROFILE_KEY = "astracv_v2_master_profile";
const APPLICATIONS_KEY = "astracv_v2_applications";
const MAX_SAVED_APPLICATIONS = 25;

export const DEFAULT_LAYOUT_CONFIG: ResumeLayoutConfig = {
  density: "balanced",
  pageTarget: 1,
  fontSizePt: 10.5,
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  hiddenSections: [],
};

/**
 * Aplica ou reverte uma sugestão de melhoria (Diff) diretamente sobre o currículo estruturado
 */
export function applyImprovementDecision(
  currentResume: ResumeData,
  improvement: ImprovementItem,
  decision: "accepted" | "rejected",
  customSnippet?: string
): ResumeData {
  const next = structuredClone(currentResume);
  const replacementText =
    decision === "rejected"
      ? improvement.originalSnippet
      : customSnippet ?? improvement.improvedSnippet;

  const currentSearchText =
    decision === "rejected"
      ? improvement.improvedSnippet
      : improvement.originalSnippet;

  // 1. Mapeamento explícito por campo
  if (
    improvement.targetField === "headline" ||
    improvement.section.toLowerCase().includes("headline") ||
    improvement.section.toLowerCase().includes("título")
  ) {
    next.headline = replacementText;
    return next;
  }

  if (
    improvement.targetField === "summary" ||
    improvement.section.toLowerCase().includes("resumo")
  ) {
    next.summary = replacementText;
    return next;
  }

  if (
    typeof improvement.experienceIndex === "number" &&
    typeof improvement.bulletIndex === "number" &&
    next.experiences[improvement.experienceIndex]?.bullets?.[
      improvement.bulletIndex
    ] !== undefined
  ) {
    next.experiences[improvement.experienceIndex].bullets[
      improvement.bulletIndex
    ] = replacementText;
    return next;
  }

  // 2. Fallback: busca por correspondência de trecho nos bullets de experiência
  for (const exp of next.experiences) {
    const idx = exp.bullets.findIndex(
      (b) =>
        b.trim() === currentSearchText.trim() ||
        b.trim() === improvement.improvedSnippet.trim() ||
        b.trim() === improvement.originalSnippet.trim()
    );
    if (idx !== -1) {
      exp.bullets[idx] = replacementText;
      return next;
    }
  }

  return next;
}

export function loadMasterProfile(): MasterProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MASTER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MasterProfile;
    if (typeof parsed?.rawText === "string" && parsed.rawText.trim().length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveMasterProfile(
  rawText: string,
  fileName?: string
): MasterProfile {
  const profile: MasterProfile = {
    rawText,
    fileName,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MASTER_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Não foi possível salvar Master Profile no localStorage:", e);
    }
  }
  return profile;
}

export function clearMasterProfile(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(MASTER_PROFILE_KEY);
  }
}

export function loadApplications(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(APPLICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveApplicationsList(records: ApplicationRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = records.slice(0, MAX_SAVED_APPLICATIONS);
    window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Falha ao persistir histórico no localStorage:", e);
  }
}

export function upsertApplicationRecord(
  record: ApplicationRecord
): ApplicationRecord[] {
  const existing = loadApplications();
  const idx = existing.findIndex((a) => a.id === record.id);
  let next: ApplicationRecord[];

  if (idx >= 0) {
    next = [...existing];
    next[idx] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    next = [record, ...existing].slice(0, MAX_SAVED_APPLICATIONS);
  }

  saveApplicationsList(next);
  return next;
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): ApplicationRecord[] {
  const existing = loadApplications();
  const next = existing.map((item) =>
    item.id === id
      ? { ...item, status, updatedAt: new Date().toISOString() }
      : item
  );
  saveApplicationsList(next);
  return next;
}

export function deleteApplicationRecord(id: string): ApplicationRecord[] {
  const existing = loadApplications();
  const next = existing.filter((item) => item.id !== id);
  saveApplicationsList(next);
  return next;
}

export function createWorkspaceBackupJson(
  masterProfile: MasterProfile | null,
  applications: ApplicationRecord[]
): string {
  const payload: WorkspaceBackup = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    masterProfile,
    applications,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseWorkspaceBackupJson(jsonString: string): WorkspaceBackup {
  const parsed = JSON.parse(jsonString);
  if (
    !parsed ||
    parsed.schemaVersion !== 2 ||
    !Array.isArray(parsed.applications)
  ) {
    throw new Error(
      "Arquivo de backup inválido ou incompatível com o schema V2 do AstraCV."
    );
  }
  return parsed as WorkspaceBackup;
}

