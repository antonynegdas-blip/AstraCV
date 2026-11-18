import {
  AtsPlatform,
  OptimizationResult,
  ResumeData,
  SectionKey,
  TargetLanguage,
} from "@/types/resume";

export type ApplicationStatus =
  | "draft"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type LayoutDensity = "compact" | "balanced" | "spacious";

export interface ResumeLayoutConfig {
  density: LayoutDensity;
  pageTarget: 1 | 2;
  fontSizePt: 10 | 10.5 | 11;
  sectionOrder: SectionKey[];
  hiddenSections: SectionKey[];
}

export interface MasterProfile {
  rawText: string;
  fileName?: string;
  updatedAt: string;
}

export interface ApplicationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  jobTitle: string;
  companyName: string;
  atsPlatform: AtsPlatform;
  targetLanguage: TargetLanguage;
  status: ApplicationStatus;
  originalResumeText: string;
  jobDescriptionText: string;
  result: OptimizationResult;
  editedResume: ResumeData;
  layoutConfig: ResumeLayoutConfig;
  isDemo?: boolean;
}

export interface WorkspaceBackup {
  schemaVersion: 2;
  exportedAt: string;
  masterProfile: MasterProfile | null;
  applications: ApplicationRecord[];
}

