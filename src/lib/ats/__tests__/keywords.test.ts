import { describe, it, expect } from "vitest";
import {
  matchSkillInText,
  countQuantifiedBullets,
  countUnfilledPlaceholders,
  detectKeywordStuffing,
} from "@/lib/ats/keywords";

describe("ATS Keywords & Metrics Engine", () => {
  it("matches exact technical skills including symbols like C#, C++, .NET, and Go", () => {
    const resumeText =
      "Desenvolvedor Backend com experiência em C#, .NET Core, C++ e Go em microsserviços.";

    expect(matchSkillInText("C#", resumeText).matched).toBe(true);
    expect(matchSkillInText(".NET", resumeText).matched).toBe(true);
    expect(matchSkillInText("C++", resumeText).matched).toBe(true);
    expect(matchSkillInText("Go", resumeText).matched).toBe(true);
    expect(matchSkillInText("Java", resumeText).matched).toBe(false);
  });

  it("avoid false positives for short skills inside words (e.g. Go inside Google or C inside CSS)", () => {
    const resumeText = "Trabalhei com Google Cloud, CSS e HTML.";

    expect(matchSkillInText("Go", resumeText).matched).toBe(false);
    expect(matchSkillInText("C", resumeText).matched).toBe(false);
  });

  it("matches technical synonyms and identifies matchType as synonym", () => {
    const resumeText =
      "Construí APIs escaláveis utilizando NodeJS, Postgres e K8s na AWS.";

    const nodeMatch = matchSkillInText("Node.js", resumeText);
    expect(nodeMatch.matched).toBe(true);
    expect(nodeMatch.matchType).toBe("synonym");

    const pgMatch = matchSkillInText("PostgreSQL", resumeText);
    expect(pgMatch.matched).toBe(true);
    expect(pgMatch.matchType).toBe("synonym");

    const k8sMatch = matchSkillInText("Kubernetes", resumeText);
    expect(k8sMatch.matched).toBe(true);
    expect(k8sMatch.matchType).toBe("synonym");
  });

  it("counts quantified bullets and excludes unfilled placeholders from real metrics", () => {
    const bullets = [
      "Reduzi a latência da API em 42% otimizando queries SQL.",
      "Arquitetei pipeline processando 200 mil eventos diários com 99.9% de uptime.",
      "Melhorei o tempo de resposta em [ex: X%] após refatoração.",
      "Participei de reuniões diárias do time ágil.",
    ];

    expect(countQuantifiedBullets(bullets)).toBe(2);
    expect(countUnfilledPlaceholders(bullets.join("\n"))).toBe(1);
  });

  it("detects keyword stuffing when a skill is repeated excessively", () => {
    const stuffedText = Array(18).fill("React TypeScript").join(" ") + " " + Array(40).fill("palavra").join(" ");
    const warnings = detectKeywordStuffing(stuffedText, ["React", "TypeScript"]);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

