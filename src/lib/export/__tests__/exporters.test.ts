import { describe, it, expect } from "vitest";
import {
  generatePlainText,
  generateMarkdown,
  generateJsonResume,
  generateGupyBlocks,
  generateDocxBuffer,
} from "@/lib/export/exporters";
import { parseDocxBuffer } from "@/lib/parsers/docx";
import { ResumeData } from "@/types/resume";

const sampleResume: ResumeData = {
  fullName: "Ana Costa",
  headline: "Engenheira de Software Sênior | Node.js, TypeScript & AWS",
  email: "ana.costa@email.com",
  phone: "+55 11 98888-7777",
  location: "São Paulo, SP",
  linkedinUrl: "https://linkedin.com/in/anacosta",
  githubUrl: "https://github.com/anacosta",
  portfolioUrl: "https://anacosta.dev",
  summary:
    "Engenheira de Software com 7 anos de experiência em arquitetura distribuída e microsserviços.",
  skills: {
    technical: ["TypeScript", "Node.js", "PostgreSQL", "Redis"],
    domain: ["Microsserviços", "TDD", "Clean Architecture"],
    tools: ["Docker", "Kubernetes", "AWS"],
  },
  experiences: [
    {
      company: "CloudPay",
      role: "Senior Backend Engineer",
      period: "2022 - Atual",
      location: "Remoto",
      technologies: ["Node.js", "TypeScript", "PostgreSQL"],
      bullets: [
        "Arquitetei motor de pagamentos processando R$ 50 milhões mensais com 99.99% de disponibilidade.",
        "Reduzi o custo de infraestrutura AWS em 32% com otimização de containers.",
      ],
    },
  ],
  education: [
    {
      degree: "Bacharelado em Engenharia de Computação",
      institution: "UNICAMP",
      year: "2018",
    },
  ],
  projects: [
    {
      name: "OpenQueue",
      description: "Biblioteca de filas distribuídas em TypeScript.",
      technologies: ["TypeScript", "Redis"],
      url: "https://github.com/anacosta/openqueue",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect",
      issuer: "AWS",
      year: "2024",
      url: "",
    },
  ],
  languages: [
    { language: "Português", proficiency: "Nativo" },
    { language: "Inglês", proficiency: "Fluente (C1)" },
  ],
};

describe("Exporters & DOCX Round-trip (Phase 2)", () => {
  it("generates pure plain text without Markdown symbols (#, **, ---)", () => {
    const plain = generatePlainText(sampleResume);

    expect(plain).toContain("ANA COSTA");
    expect(plain).toContain("Engenheira de Software Sênior");
    expect(plain).toContain("AWS Certified Solutions Architect");
    expect(plain).toContain("Inglês: Fluente (C1)");
    expect(plain).not.toMatch(/^#\s/m);
    expect(plain).not.toContain("**");
    expect(plain).not.toContain("---");
  });

  it("respects custom sectionOrder and hiddenSections in plain text and markdown", () => {
    const md = generateMarkdown(sampleResume, {
      sectionOrder: ["projects", "experiences", "summary", "skills", "education"],
      hiddenSections: ["certifications", "languages"],
    });

    const projIndex = md.indexOf("PROJETOS");
    const expIndex = md.indexOf("EXPERIÊNCIA");
    expect(projIndex).toBeGreaterThan(-1);
    expect(expIndex).toBeGreaterThan(projIndex);
    expect(md).not.toContain("AWS Certified Solutions Architect");
  });

  it("exports valid JSON Resume schema", () => {
    const jsonStr = generateJsonResume(sampleResume);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.basics.name).toBe("Ana Costa");
    expect(parsed.work).toHaveLength(1);
    expect(parsed.work[0].name).toBe("CloudPay");
    expect(parsed.certificates).toHaveLength(1);
    expect(parsed.languages).toHaveLength(2);
  });

  it("builds Gupy/Workday quick-copy blocks per experience and section", () => {
    const blocks = generateGupyBlocks(sampleResume);
    expect(blocks.length).toBeGreaterThanOrEqual(4);
    expect(blocks.some((b) => b.id === "exp-0" && b.content.includes("CloudPay"))).toBe(true);
  });

  it("generates a real .docx buffer (ZIP magic bytes PK) and parses it back via mammoth", async () => {
    const buffer = await generateDocxBuffer(sampleResume);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    const header = new Uint8Array(buffer.slice(0, 4));
    expect(header[0]).toBe(0x50); // 'P'
    expect(header[1]).toBe(0x4b); // 'K'

    const extractedText = await parseDocxBuffer(buffer);
    expect(extractedText).toContain("Ana Costa");
    expect(extractedText).toContain("CloudPay");
    expect(extractedText).toContain("AWS Certified Solutions Architect");
  });
});

