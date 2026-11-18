import { AtsPlatform } from "@/types/resume";

export interface AtsProfileConfig {
  id: AtsPlatform;
  name: string;
  description: string;
  /** Peso dado a um match por sinônimo (vs 1.0 para match exato) */
  synonymMatchFactor: number;
  /** Pesos dos 4 pilares no cálculo do Score Geral (soma = 1.0) */
  weights: {
    hardSkills: number;
    experienceAlignment: number;
    impactMetrics: number;
    atsClarity: number;
  };
}

export const ATS_PROFILES: Record<AtsPlatform, AtsProfileConfig> = {
  general: {
    id: "general",
    name: "Padrão Universal ATS",
    description: "Balanceado para triagem técnica híbrida (algoritmo + tech recruiter).",
    synonymMatchFactor: 0.8,
    weights: {
      hardSkills: 0.4,
      experienceAlignment: 0.25,
      impactMetrics: 0.2,
      atsClarity: 0.15,
    },
  },
  gupy: {
    id: "gupy",
    name: "Gupy & Portais BR",
    description: "Foco rigoroso em correspondência exata de termos no título, resumo e skills.",
    synonymMatchFactor: 0.55,
    weights: {
      hardSkills: 0.48,
      experienceAlignment: 0.24,
      impactMetrics: 0.13,
      atsClarity: 0.15,
    },
  },
  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse & Lever (Big Tech / Gringa)",
    description: "Prioriza realizações quantificáveis (Google XYZ), senioridade e impacto de engenharia.",
    synonymMatchFactor: 0.88,
    weights: {
      hardSkills: 0.35,
      experienceAlignment: 0.27,
      impactMetrics: 0.26,
      atsClarity: 0.12,
    },
  },
  workday: {
    id: "workday",
    name: "Workday & Enterprise ATS",
    description: "Exige alta padronização estrutural, cronologia clara e nomenclatura corporativa.",
    synonymMatchFactor: 0.7,
    weights: {
      hardSkills: 0.38,
      experienceAlignment: 0.25,
      impactMetrics: 0.15,
      atsClarity: 0.22,
    },
  },
};

export function getAtsProfile(platform: AtsPlatform = "general"): AtsProfileConfig {
  return ATS_PROFILES[platform] || ATS_PROFILES.general;
}

