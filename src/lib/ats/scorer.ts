import {
  AtsPlatform,
  JobAnalysis,
  KeywordMatchDetail,
  ResumeData,
  ScoreBreakdown,
} from "@/types/resume";
import {
  countQuantifiedBullets,
  countUnfilledPlaceholders,
  detectKeywordStuffing,
  hasStrongActionVerb,
  matchSkillInText,
  normalizeText,
} from "@/lib/ats/keywords";
import { getAtsProfile } from "@/lib/ats/profiles";

export interface DeterministicEvaluation {
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingDesiredKeywords: string[];
  keywordDetails: KeywordMatchDetail[];
  unfilledPlaceholdersCount: number;
  stuffingWarnings: string[];
}

export function resumeDataToText(resume: ResumeData): string {
  const parts: string[] = [
    resume.fullName,
    resume.headline,
    resume.email || "",
    resume.phone || "",
    resume.location || "",
    resume.linkedinUrl || "",
    resume.githubUrl || "",
    resume.summary,
    ...(resume.skills.technical || []),
    ...(resume.skills.domain || []),
    ...(resume.skills.tools || []),
  ];

  for (const exp of resume.experiences || []) {
    parts.push(`${exp.role} ${exp.company} ${exp.period}`);
    if (exp.technologies?.length) parts.push(exp.technologies.join(" "));
    parts.push(...(exp.bullets || []));
  }

  for (const proj of resume.projects || []) {
    parts.push(`${proj.name} ${proj.description}`);
    if (proj.technologies?.length) parts.push(proj.technologies.join(" "));
  }

  for (const edu of resume.education || []) {
    parts.push(`${edu.degree} ${edu.institution} ${edu.year}`);
  }

  for (const cert of resume.certifications || []) {
    parts.push(`${cert.name} ${cert.issuer} ${cert.year}`);
  }

  for (const lang of resume.languages || []) {
    parts.push(`${lang.language} ${lang.proficiency}`);
  }

  return parts.filter(Boolean).join("\n");
}

function extractBulletsFromInput(input: string | ResumeData): string[] {
  if (typeof input !== "string") {
    return input.experiences.flatMap((e) => e.bullets || []);
  }

  return input
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.startsWith("-") ||
        l.startsWith("•") ||
        l.startsWith("*") ||
        (l.length > 45 && !l.endsWith(":"))
    )
    .map((l) => l.replace(/^[-•*]\s*/, ""));
}

export function evaluateResumeDeterministically(
  input: string | ResumeData,
  job: JobAnalysis,
  platform: AtsPlatform = "general"
): DeterministicEvaluation {
  const profile = getAtsProfile(platform);
  const fullText = typeof input === "string" ? input : resumeDataToText(input);
  const bullets = extractBulletsFromInput(input);

  const headlineAndSummaryText =
    typeof input === "string"
      ? input.slice(0, 600)
      : `${input.headline}\n${input.summary}`;

  const skillsText =
    typeof input === "string"
      ? fullText
      : [
          ...input.skills.technical,
          ...input.skills.domain,
          ...input.skills.tools,
        ].join(" ");

  const experienceText =
    typeof input === "string"
      ? fullText
      : input.experiences
          .map((e) => `${e.role} ${e.technologies?.join(" ")} ${e.bullets.join(" ")}`)
          .join("\n");

  const requiredSkills = job.requiredSkills || [];
  const desiredSkills = job.desiredSkills || [];

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const missingDesiredKeywords: string[] = [];
  const keywordDetails: KeywordMatchDetail[] = [];

  let earnedSkillPoints = 0;
  let totalPossibleSkillPoints = 0;

  // 1. Avalia Required Skills (peso 2.0 cada)
  for (const skill of requiredSkills) {
    const weight = 2.0;
    totalPossibleSkillPoints += weight;

    const match = matchSkillInText(skill, fullText);
    if (match.matched) {
      matchedKeywords.push(skill);
      const factor = match.matchType === "exact" ? 1.0 : profile.synonymMatchFactor;
      earnedSkillPoints += weight * factor;

      const foundIn: string[] = [];
      if (matchSkillInText(skill, headlineAndSummaryText).matched) foundIn.push("Resumo/Título");
      if (matchSkillInText(skill, skillsText).matched) foundIn.push("Skills");
      if (matchSkillInText(skill, experienceText).matched) foundIn.push("Experiência");

      keywordDetails.push({
        keyword: skill,
        matchType: match.matchType === "exact" ? "exact" : "synonym",
        matchedTerm: match.matchedTerm,
        isRequired: true,
        foundIn: foundIn.length > 0 ? foundIn : ["Geral"],
      });
    } else {
      missingKeywords.push(skill);
    }
  }

  // 2. Avalia Desired Skills (peso 1.0 cada)
  for (const skill of desiredSkills) {
    if (requiredSkills.some((r) => normalizeText(r) === normalizeText(skill))) {
      continue;
    }
    const weight = 1.0;
    totalPossibleSkillPoints += weight;

    const match = matchSkillInText(skill, fullText);
    if (match.matched) {
      matchedKeywords.push(skill);
      const factor = match.matchType === "exact" ? 1.0 : profile.synonymMatchFactor;
      earnedSkillPoints += weight * factor;

      keywordDetails.push({
        keyword: skill,
        matchType: match.matchType === "exact" ? "exact" : "synonym",
        matchedTerm: match.matchedTerm,
        isRequired: false,
        foundIn: ["Currículo"],
      });
    } else {
      missingDesiredKeywords.push(skill);
    }
  }

  const hardSkillsScore =
    totalPossibleSkillPoints > 0
      ? Math.round((earnedSkillPoints / totalPossibleSkillPoints) * 100)
      : 80;

  // 3. Alinhamento de Escopo & Senioridade
  const normFull = normalizeText(fullText);
  const normSeniority = normalizeText(job.seniority || "");
  let seniorityBonus = 0;
  if (
    (normSeniority.includes("senior") &&
      (normFull.includes("senior") || normFull.includes("lead") || normFull.includes("especialista"))) ||
    (normSeniority.includes("pleno") &&
      (normFull.includes("pleno") || normFull.includes("senior") || normFull.includes("mid"))) ||
    (normSeniority.includes("junior") && normFull.length > 100)
  ) {
    seniorityBonus = 25;
  } else if (normFull.length > 350) {
    seniorityBonus = 12;
  }

  // Cobertura de responsabilidades e verbos de ação
  const respList = job.responsibilities || [];
  let respMatchRatio = 0.6;
  if (respList.length > 0) {
    let matchedResps = 0;
    for (const resp of respList) {
      const tokens = normalizeText(resp)
        .split(/\W+/)
        .filter((t) => t.length >= 4);
      const hitCount = tokens.filter((t) => normFull.includes(t)).length;
      if (tokens.length > 0 && hitCount / tokens.length >= 0.35) {
        matchedResps += 1;
      }
    }
    respMatchRatio = matchedResps / respList.length;
  }

  const actionVerbBullets = bullets.filter(hasStrongActionVerb).length;
  const actionVerbRatio =
    bullets.length > 0 ? Math.min(1, actionVerbBullets / Math.max(2, bullets.length * 0.7)) : 0.2;

  const experienceAlignmentScore = Math.min(
    100,
    Math.round(seniorityBonus + respMatchRatio * 45 + actionVerbRatio * 30)
  );

  // 4. Impacto Quantificável (Google XYZ) & Penalidade de Placeholders
  const unfilledPlaceholdersCount = countUnfilledPlaceholders(fullText);
  const quantifiedCount = countQuantifiedBullets(bullets);
  const targetQuantifiedBullets = Math.max(2, Math.ceil(bullets.length * 0.6));
  const rawMetricRatio = Math.min(1, quantifiedCount / targetQuantifiedBullets);

  const placeholderPenalty = Math.min(35, unfilledPlaceholdersCount * 12);
  const impactMetricsScore = Math.max(
    10,
    Math.min(100, Math.round(rawMetricRatio * 90 + 10 - placeholderPenalty))
  );

  // 5. Clareza e Estrutura ATS
  let clarityPoints = 40;
  if (/@/.test(fullText)) clarityPoints += 12; // Email presente
  if (/\d{4}/.test(fullText)) clarityPoints += 12; // Datas presentes
  if (typeof input !== "string") {
    if (input.summary && input.summary.length >= 60) clarityPoints += 12;
    if (input.skills.technical.length >= 3) clarityPoints += 12;
    if (input.experiences.length >= 1 && bullets.length >= 2) clarityPoints += 12;
  } else {
    if (fullText.length >= 350) clarityPoints += 18;
    if (bullets.length >= 3) clarityPoints += 18;
  }

  const stuffingWarnings = detectKeywordStuffing(fullText, [
    ...requiredSkills,
    ...desiredSkills,
  ]);
  if (stuffingWarnings.length > 0) {
    clarityPoints -= stuffingWarnings.length * 15;
  }

  const atsClarityScore = Math.max(15, Math.min(100, clarityPoints));

  const scoreBreakdown: ScoreBreakdown = {
    hardSkillsScore,
    experienceAlignmentScore,
    impactMetricsScore,
    atsClarityScore,
  };

  const atsScore = Math.round(
    hardSkillsScore * profile.weights.hardSkills +
      experienceAlignmentScore * profile.weights.experienceAlignment +
      impactMetricsScore * profile.weights.impactMetrics +
      atsClarityScore * profile.weights.atsClarity
  );

  return {
    atsScore: Math.max(0, Math.min(100, atsScore)),
    scoreBreakdown,
    matchedKeywords,
    missingKeywords,
    missingDesiredKeywords,
    keywordDetails,
    unfilledPlaceholdersCount,
    stuffingWarnings,
  };
}

