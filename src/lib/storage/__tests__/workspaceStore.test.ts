import { describe, it, expect } from "vitest";
import {
  applyImprovementDecision,
  createWorkspaceBackupJson,
  parseWorkspaceBackupJson,
} from "@/lib/storage/workspaceStore";
import { generateMockOptimizationResult } from "@/lib/gemini";
import { SAMPLE_JOB, SAMPLE_RESUME } from "@/lib/sampleData";

describe("Workspace Store & Diff Decisions (Phase 3)", () => {
  it("reverts an improvement back to originalSnippet when rejected and restores improvedSnippet when accepted", () => {
    const result = generateMockOptimizationResult(
      SAMPLE_RESUME,
      SAMPLE_JOB,
      "gupy",
      "pt-BR"
    );
    const resume = structuredClone(result.optimizedResume);
    const bulletImprovement = result.improvements.find(
      (i) => i.targetField === "experience_bullet" && i.experienceIndex === 0
    )!;

    // Rejeita melhoria -> deve voltar ao trecho original
    const afterReject = applyImprovementDecision(
      resume,
      bulletImprovement,
      "rejected"
    );
    expect(afterReject.experiences[0].bullets[0]).toBe(
      bulletImprovement.originalSnippet
    );

    // Aceita com edição customizada -> deve aplicar o texto customizado
    const customBullet =
      "Liderei migração para Next.js 16 reduzindo o LCP em 55% em produção.";
    const afterCustomAccept = applyImprovementDecision(
      afterReject,
      bulletImprovement,
      "accepted",
      customBullet
    );
    expect(afterCustomAccept.experiences[0].bullets[0]).toBe(customBullet);
  });

  it("serializes and validates WorkspaceBackup JSON safely", () => {
    const backupStr = createWorkspaceBackupJson(
      {
        rawText: SAMPLE_RESUME,
        fileName: "curriculo-master.pdf",
        updatedAt: new Date().toISOString(),
      },
      []
    );

    const parsed = parseWorkspaceBackupJson(backupStr);
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.masterProfile?.fileName).toBe("curriculo-master.pdf");
    expect(parsed.applications).toHaveLength(0);
  });
});

