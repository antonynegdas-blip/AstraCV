import { describe, it, expect } from "vitest";
import { evaluateResumeDeterministically } from "@/lib/ats/scorer";
import { JobAnalysis, ResumeData } from "@/types/resume";

const mockJob: JobAnalysis = {
  roleTitle: "Desenvolvedor Full Stack Sênior",
  companyName: "Fintech BR",
  seniority: "Sênior",
  requiredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"],
  desiredSkills: ["Next.js", "CI/CD", "AWS"],
  responsibilities: [
    "Arquitetar microsserviços escaláveis",
    "Liderar modernização front-end",
    "Implementar testes automatizados",
  ],
  cultureKeywords: ["Ownership", "Agile"],
};

const weakResumeText = `
João Silva
Desenvolvedor Web
joao@email.com

Experiência:
Empresa X (2021 - 2023)
- Fiz telas em React e ajudei no backend em NodeJS.
`;

const strongResume: ResumeData = {
  fullName: "João Silva",
  headline: "Desenvolvedor Full Stack Sênior | TypeScript, React, Next.js & Node.js",
  email: "joao@email.com",
  phone: "+55 11 99999-9999",
  location: "São Paulo, SP",
  linkedinUrl: "https://linkedin.com/in/joao",
  githubUrl: "https://github.com/joao",
  portfolioUrl: "",
  summary:
    "Engenheiro de Software Sênior com 6 anos de experiência arquitetando microsserviços em TypeScript, Node.js, PostgreSQL e aplicações front-end em React e Next.js com Docker e AWS.",
  skills: {
    technical: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL"],
    domain: ["Microsserviços", "Testes Automatizados", "Agile"],
    tools: ["Docker", "CI/CD", "AWS", "Git"],
  },
  experiences: [
    {
      company: "Fintech Alpha",
      role: "Desenvolvedor Full Stack Sênior",
      period: "Jan 2022 - Atual",
      location: "Remoto",
      technologies: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Docker"],
      bullets: [
        "Arquitetei microsserviços em Node.js e TypeScript reduzindo a latência em 45% para 500 mil usuários.",
        "Liderei a modernização do front-end para React e Next.js, elevando a conversão em 22%.",
        "Implementei pipeline de CI/CD e testes automatizados na AWS, alcançando 92% de cobertura.",
      ],
    },
  ],
  education: [
    {
      degree: "Bacharelado em Ciência da Computação",
      institution: "USP",
      year: "2019",
    },
  ],
  projects: [],
  certifications: [],
  languages: [{ language: "Inglês", proficiency: "Avançado" }],
};

describe("Deterministic ATS Scorer", () => {
  it("scores a calibrated resume significantly higher than an uncalibrated weak resume", () => {
    const before = evaluateResumeDeterministically(weakResumeText, mockJob, "gupy");
    const after = evaluateResumeDeterministically(strongResume, mockJob, "gupy");

    expect(after.atsScore).toBeGreaterThan(before.atsScore + 25);
    expect(after.atsScore).toBeGreaterThanOrEqual(80);
    expect(before.missingKeywords).toContain("TypeScript");
    expect(after.missingKeywords.length).toBe(0);
  });

  it("penalizes unfilled metric placeholders in impactMetricsScore", () => {
    const resumeWithPlaceholders: ResumeData = {
      ...strongResume,
      experiences: [
        {
          ...strongResume.experiences[0],
          bullets: [
            "Arquitetei microsserviços reduzindo a latência em [ex: X%].",
            "Liderei modernização do front-end aumentando performance em [ex: Y%].",
          ],
        },
      ],
    };

    const cleanEval = evaluateResumeDeterministically(strongResume, mockJob, "greenhouse");
    const placeholderEval = evaluateResumeDeterministically(
      resumeWithPlaceholders,
      mockJob,
      "greenhouse"
    );

    expect(placeholderEval.unfilledPlaceholdersCount).toBe(2);
    expect(placeholderEval.scoreBreakdown.impactMetricsScore).toBeLessThan(
      cleanEval.scoreBreakdown.impactMetricsScore
    );
  });

  it("applies stricter exact-match weighting on Gupy profile vs Greenhouse profile when only synonyms are used", () => {
    const synonymOnlyText = `
      João Silva - Desenvolvedor Sênior
      joao@email.com | +55 11 99999-9999 | linkedin.com/in/joao
      Resumo: Engenheiro Sênior com TS, ReactJS, NodeJS, Postgres e containers.
      Experiência:
      - Arquitetei sistemas com TS e NodeJS reduzindo custos em 30%.
      - Liderei front-end em ReactJS melhorando LCP em 40%.
      - Implementei banco Postgres para 100 mil clientes.
      Formação: Ciência da Computação (2020)
    `;

    const gupyEval = evaluateResumeDeterministically(synonymOnlyText, mockJob, "gupy");
    const greenhouseEval = evaluateResumeDeterministically(
      synonymOnlyText,
      mockJob,
      "greenhouse"
    );

    expect(gupyEval.scoreBreakdown.hardSkillsScore).toBeLessThan(
      greenhouseEval.scoreBreakdown.hardSkillsScore
    );
  });
});

