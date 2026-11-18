import { z } from "zod";

// --- Opções de Plataforma ATS e Idioma ---
export const AtsPlatformSchema = z
  .enum(["general", "gupy", "greenhouse", "workday"])
  .default("general");

export type AtsPlatform = z.infer<typeof AtsPlatformSchema>;

export const TargetLanguageSchema = z
  .enum(["auto", "pt-BR", "en-US"])
  .default("auto");

export type TargetLanguage = z.infer<typeof TargetLanguageSchema>;

// --- Seções Ordenáveis do Currículo ---
export const SectionKeySchema = z.enum([
  "summary",
  "skills",
  "experiences",
  "projects",
  "education",
  "certifications",
  "languages",
]);

export type SectionKey = z.infer<typeof SectionKeySchema>;

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "skills",
  "experiences",
  "projects",
  "education",
  "certifications",
  "languages",
];

// --- Itens Adicionais V2: Idiomas e Certificações ---
export const LanguageItemSchema = z.object({
  language: z.string().describe("Ex: Inglês, Português, Espanhol"),
  proficiency: z
    .string()
    .describe("Ex: Nativo, Fluente (C1/C2), Avançado (B2), Intermediário (B1)"),
});

export type LanguageItem = z.infer<typeof LanguageItemSchema>;

export const CertificationItemSchema = z.object({
  name: z.string().describe("Ex: AWS Certified Solutions Architect"),
  issuer: z.string().describe("Ex: Amazon Web Services"),
  year: z.string().optional().default(""),
  url: z.string().optional().default(""),
});

export type CertificationItem = z.infer<typeof CertificationItemSchema>;

// --- Schema do Currículo ---
export const ResumeSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  headline: z
    .string()
    .describe("Título profissional, ex: Desenvolvedor Full Stack Sênior | Node.js, React"),
  email: z.string().optional().default(""),
  phone: z.string().optional().or(z.literal("")).default(""),
  location: z.string().optional().or(z.literal("")).default(""),
  linkedinUrl: z.string().optional().or(z.literal("")).default(""),
  githubUrl: z.string().optional().or(z.literal("")).default(""),
  portfolioUrl: z.string().optional().or(z.literal("")).default(""),
  summary: z.string().describe("Resumo profissional focado em valor e impacto"),
  skills: z.object({
    technical: z
      .array(z.string())
      .describe("Linguagens, frameworks, bancos de dados, cloud"),
    domain: z
      .array(z.string())
      .describe("Metodologias ágeis, arquitetura, boas práticas, segurança"),
    tools: z
      .array(z.string())
      .describe("Ferramentas como Docker, Git, CI/CD, Jira"),
  }),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      period: z.string().describe("Ex: Jan 2022 - Atual"),
      location: z.string().optional().or(z.literal("")).default(""),
      technologies: z.array(z.string()).optional().default([]),
      bullets: z
        .array(z.string())
        .describe("Lista de realizações e responsabilidades com métricas de impacto"),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string().describe("Ex: Bacharelado em Ciência da Computação"),
      institution: z.string(),
      year: z.string(),
    })
  ),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        url: z.string().optional().or(z.literal("")).default(""),
      })
    )
    .optional()
    .default([]),
  certifications: z.array(CertificationItemSchema).optional().default([]),
  languages: z.array(LanguageItemSchema).optional().default([]),
});

export type ResumeData = z.infer<typeof ResumeSchema>;

// --- Schema da Vaga ---
export const JobAnalysisSchema = z.object({
  roleTitle: z.string(),
  companyName: z.string().optional().default("Empresa Alvo"),
  seniority: z
    .string()
    .describe("Júnior, Pleno, Sênior, Especialista ou Tech Lead"),
  requiredSkills: z.array(z.string()).describe("Hard skills obrigatórias"),
  desiredSkills: z
    .array(z.string())
    .describe("Diferenciais / Nice to have"),
  responsibilities: z.array(z.string()).describe("Principais atribuições"),
  cultureKeywords: z
    .array(z.string())
    .describe("Palavras-chave de cultura e soft skills"),
});

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

// --- Breakdown de Score (4 Pilares V2 + Retrocompatibilidade V1) ---
export const ScoreBreakdownSchema = z.object({
  hardSkillsScore: z.number().min(0).max(100),
  experienceAlignmentScore: z.number().min(0).max(100),
  impactMetricsScore: z.number().min(0).max(100).optional().default(75),
  atsClarityScore: z.number().min(0).max(100),
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

// --- Detalhe de Keyword Match ---
export const KeywordMatchDetailSchema = z.object({
  keyword: z.string(),
  matchType: z.enum(["exact", "synonym"]),
  matchedTerm: z.string(),
  isRequired: z.boolean().default(true),
  foundIn: z.array(z.string()).default([]),
});

export type KeywordMatchDetail = z.infer<typeof KeywordMatchDetailSchema>;

// --- Item de Melhoria (Diff) ---
export const ImprovementItemSchema = z.object({
  id: z.string().optional().default(""),
  section: z
    .string()
    .describe("Seção alterada (ex: Resumo, Experiência na Empresa X)"),
  targetField: z
    .enum(["headline", "summary", "experience_bullet", "skills", "project"])
    .optional()
    .default("experience_bullet"),
  experienceIndex: z.number().optional(),
  bulletIndex: z.number().optional(),
  originalSnippet: z.string().describe("Trecho original"),
  improvedSnippet: z
    .string()
    .describe("Novo trecho otimizado com método STAR/XYZ"),
  rationale: z
    .string()
    .describe("Por que essa mudança aumenta a chance de aprovação"),
  status: z
    .enum(["accepted", "rejected", "pending"])
    .optional()
    .default("accepted"),
});

export type ImprovementItem = z.infer<typeof ImprovementItemSchema>;

// --- Preparação para Entrevista & Abordagem ---
export const InterviewPrepSchema = z.object({
  technicalQuestions: z
    .array(
      z.object({
        question: z.string(),
        focusSkill: z.string(),
        suggestedApproach: z.string(),
      })
    )
    .default([]),
  gapMitigationTips: z.array(z.string()).default([]),
  linkedinOutreachMessage: z.string().default(""),
});

export type InterviewPrep = z.infer<typeof InterviewPrepSchema>;

// --- Schema do Resultado da Otimização V2 ---
export const OptimizationResultSchema = z.object({
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Pontuação geral de aderência ATS do currículo calibrado (0 a 100)"),
  originalAtsScore: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Pontuação ATS do currículo original antes da otimização"),
  scoreBreakdown: ScoreBreakdownSchema,
  originalScoreBreakdown: ScoreBreakdownSchema.optional(),
  jobAnalysis: JobAnalysisSchema.optional(),
  matchedKeywords: z
    .array(z.string())
    .describe("Palavras-chave da vaga que constam no currículo"),
  missingKeywords: z
    .array(z.string())
    .describe("Palavras-chave essenciais da vaga que estão faltando"),
  missingDesiredKeywords: z.array(z.string()).optional().default([]),
  keywordDetails: z.array(KeywordMatchDetailSchema).optional().default([]),
  unfilledPlaceholdersCount: z.number().optional().default(0),
  criticalAlerts: z
    .array(z.string())
    .describe("Alertas críticos de triagem (ex: tempo de experiência, ausência de stack principal)"),
  actionableTips: z
    .array(z.string())
    .describe("Dicas práticas para o candidato se destacar na entrevista"),
  optimizedResume: ResumeSchema,
  improvements: z.array(ImprovementItemSchema),
  interviewPrep: InterviewPrepSchema.optional(),
  atsPlatform: AtsPlatformSchema.optional().default("general"),
  targetLanguage: TargetLanguageSchema.optional().default("auto"),
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;
