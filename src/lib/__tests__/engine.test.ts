import { describe, it, expect } from "vitest";
import { checkRateLimitAsync } from "@/lib/ratelimit";
import {
  enrichWithHybridScoring,
  generateMockOptimizationResult,
  optimizeResumeWithGemini,
} from "@/lib/gemini";
import { SAMPLE_JOB, SAMPLE_RESUME } from "@/lib/sampleData";

describe("Rate Limiter & Hybrid Engine (Phase 1)", () => {
  it("enforces rate limit window and blocks requests exceeding the threshold", async () => {
    const testIp = `192.0.2.${Math.floor(Math.random() * 200)}`;
    const r1 = await checkRateLimitAsync(testIp, 2, 60, "test_ns");
    const r2 = await checkRateLimitAsync(testIp, 2, 60, "test_ns");
    const r3 = await checkRateLimitAsync(testIp, 2, 60, "test_ns");

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
    expect(r3.allowed).toBe(false);
    expect(r3.resetInSeconds).toBeGreaterThan(0);
  });

  it("enriches optimization result with hybrid deterministic before/after scores and keyword details", () => {
    const rawMock = generateMockOptimizationResult(
      SAMPLE_RESUME,
      SAMPLE_JOB,
      "gupy",
      "pt-BR"
    );

    const enriched = enrichWithHybridScoring(
      rawMock,
      SAMPLE_RESUME,
      SAMPLE_JOB,
      "gupy",
      "pt-BR"
    );

    expect(enriched.originalAtsScore).toBeDefined();
    expect(enriched.atsScore).toBeGreaterThan(enriched.originalAtsScore!);
    expect(enriched.keywordDetails?.length).toBeGreaterThan(0);
    expect(enriched.unfilledPlaceholdersCount).toBe(1);
    expect(enriched.improvements.every((imp) => Boolean(imp.id))).toBe(true);
  });

  it("runs optimizeResumeWithGemini in forceDemo mode and respects targetLanguage en-US", async () => {
    const res = await optimizeResumeWithGemini(SAMPLE_RESUME, SAMPLE_JOB, {
      atsPlatform: "greenhouse",
      targetLanguage: "en-US",
      forceDemo: true,
    });

    expect(res.atsPlatform).toBe("greenhouse");
    expect(res.targetLanguage).toBe("en-US");
    expect(res.optimizedResume.headline).toContain("Senior Full Stack Engineer");
    expect(res.interviewPrep?.technicalQuestions.length).toBeGreaterThan(0);
  });
});
