"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { InputSection } from "@/components/InputSection";
import { ScoreDashboard } from "@/components/ScoreDashboard";
import { ResumeViewer } from "@/components/ResumeViewer";
import { DiffViewer } from "@/components/DiffViewer";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import { WorkspaceDrawer } from "@/components/WorkspaceDrawer";
import {
  AtsPlatform,
  ImprovementItem,
  OptimizationResult,
  ResumeData,
  TargetLanguage,
} from "@/types/resume";
import {
  ApplicationRecord,
  ApplicationStatus,
  MasterProfile,
  ResumeLayoutConfig,
} from "@/types/workspace";
import { evaluateResumeDeterministically } from "@/lib/ats/scorer";
import {
  applyImprovementDecision,
  clearMasterProfile,
  createWorkspaceBackupJson,
  DEFAULT_LAYOUT_CONFIG,
  deleteApplicationRecord,
  loadApplications,
  loadMasterProfile,
  parseWorkspaceBackupJson,
  saveApplicationsList,
  saveMasterProfile,
  updateApplicationStatus,
  upsertApplicationRecord,
} from "@/lib/storage/workspaceStore";
import {
  BarChart3,
  FileCheck,
  GitCompare,
  CheckCircle2,
  MessageSquareCode,
} from "lucide-react";

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [atsPlatform, setAtsPlatform] = useState<AtsPlatform>("general");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("auto");

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [editedResume, setEditedResume] = useState<ResumeData | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<ResumeLayoutConfig>(
    DEFAULT_LAYOUT_CONFIG
  );

  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(
    null
  );
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(
    null
  );
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "resume" | "diff" | "interview"
  >("dashboard");

  const resultsRef = useRef<HTMLDivElement>(null);

  // Carrega Master Profile e Histórico Local-First na montagem via callback assíncrono
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const mp = loadMasterProfile();
      const apps = loadApplications();
      setMasterProfile(mp);
      setApplications(apps);
      if (mp) {
        setResumeText((prev) => prev || mp.rawText);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Recalcula Score Determinístico Ao Vivo sempre que o usuário edita o currículo ou toma decisões no Diff
  const liveEvaluation = useMemo(() => {
    if (!result || !editedResume) return null;
    const job = result.jobAnalysis || {
      roleTitle: editedResume.headline,
      companyName: "Empresa Alvo",
      seniority: "Pleno/Sênior",
      requiredSkills: [
        ...result.matchedKeywords,
        ...result.missingKeywords,
      ],
      desiredSkills: result.missingDesiredKeywords || [],
      responsibilities: [jobDescription.slice(0, 200)],
      cultureKeywords: [],
    };
    return evaluateResumeDeterministically(editedResume, job, atsPlatform);
  }, [result, editedResume, atsPlatform, jobDescription]);

  const syncActiveSession = (
    nextResume: ResumeData,
    nextLayout: ResumeLayoutConfig,
    nextResult: OptimizationResult = result!
  ) => {
    setEditedResume(nextResume);
    setLayoutConfig(nextLayout);
    if (!activeApplicationId || !nextResult) return;

    const job = nextResult.jobAnalysis || {
      roleTitle: nextResume.headline,
      companyName: "Empresa Alvo",
      seniority: "Pleno/Sênior",
      requiredSkills: [
        ...nextResult.matchedKeywords,
        ...nextResult.missingKeywords,
      ],
      desiredSkills: nextResult.missingDesiredKeywords || [],
      responsibilities: [jobDescription.slice(0, 200)],
      cultureKeywords: [],
    };
    const evalNow = evaluateResumeDeterministically(
      nextResume,
      job,
      atsPlatform
    );

    const updatedResult: OptimizationResult = {
      ...nextResult,
      atsScore: evalNow.atsScore,
      scoreBreakdown: evalNow.scoreBreakdown,
      unfilledPlaceholdersCount: evalNow.unfilledPlaceholdersCount,
    };

    const existingApp = applications.find((a) => a.id === activeApplicationId);
    const record: ApplicationRecord = {
      id: activeApplicationId,
      createdAt: existingApp?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobTitle:
        nextResult.jobAnalysis?.roleTitle ||
        nextResume.headline.split("|")[0]?.trim() ||
        "Vaga Técnica",
      companyName: nextResult.jobAnalysis?.companyName || "Candidatura ATS",
      atsPlatform,
      targetLanguage,
      status: existingApp?.status || "draft",
      originalResumeText: resumeText,
      jobDescriptionText: jobDescription,
      result: updatedResult,
      editedResume: nextResume,
      layoutConfig: nextLayout,
      isDemo,
    };

    const nextApps = upsertApplicationRecord(record);
    setApplications(nextApps);
  };

  const handleOptimize = async (forceDemo: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          atsPlatform,
          targetLanguage,
          forceDemo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "Ocorreu uma falha durante o processamento."
        );
      }

      const data = json.data as OptimizationResult;
      const newId = `app-${Date.now()}`;

      setResult(data);
      setEditedResume(structuredClone(data.optimizedResume));
      setIsDemo(!!json.isDemo);
      setActiveApplicationId(newId);
      setActiveTab("dashboard");

      const record: ApplicationRecord = {
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        jobTitle:
          data.jobAnalysis?.roleTitle ||
          data.optimizedResume.headline.split("|")[0]?.trim() ||
          "Vaga Técnica",
        companyName: data.jobAnalysis?.companyName || "Candidatura ATS",
        atsPlatform,
        targetLanguage,
        status: "draft",
        originalResumeText: resumeText,
        jobDescriptionText: jobDescription,
        result: data,
        editedResume: structuredClone(data.optimizedResume),
        layoutConfig,
        isDemo: !!json.isDemo,
      };

      const nextApps = upsertApplicationRecord(record);
      setApplications(nextApps);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro inesperado ao processar.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiffDecision = (
    improvement: ImprovementItem,
    decision: "accepted" | "rejected",
    customSnippet?: string
  ) => {
    if (!result || !editedResume) return;

    const updatedResume = applyImprovementDecision(
      editedResume,
      improvement,
      decision,
      customSnippet
    );

    const updatedImprovements = result.improvements.map((item) =>
      item.id === improvement.id
        ? {
            ...item,
            status: decision,
            improvedSnippet: customSnippet ?? item.improvedSnippet,
          }
        : item
    );

    const nextResult: OptimizationResult = {
      ...result,
      improvements: updatedImprovements,
    };
    setResult(nextResult);
    syncActiveSession(updatedResume, layoutConfig, nextResult);
  };

  const handleBulkDiffDecision = (decision: "accepted" | "rejected") => {
    if (!result || !editedResume) return;
    let workingResume = structuredClone(editedResume);
    const updatedImprovements = result.improvements.map((item) => {
      workingResume = applyImprovementDecision(workingResume, item, decision);
      return { ...item, status: decision };
    });

    const nextResult: OptimizationResult = {
      ...result,
      improvements: updatedImprovements,
    };
    setResult(nextResult);
    syncActiveSession(workingResume, layoutConfig, nextResult);
  };

  const handleSelectApplication = (record: ApplicationRecord) => {
    setActiveApplicationId(record.id);
    setResumeText(record.originalResumeText);
    setJobDescription(record.jobDescriptionText);
    setAtsPlatform(record.atsPlatform);
    setTargetLanguage(record.targetLanguage);
    setResult(record.result);
    setEditedResume(structuredClone(record.editedResume));
    setLayoutConfig(record.layoutConfig || DEFAULT_LAYOUT_CONFIG);
    setIsDemo(!!record.isDemo);
    setActiveTab("dashboard");
  };

  const handleExportBackup = () => {
    const json = createWorkspaceBackupJson(masterProfile, applications);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astracv-v2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonText: string) => {
    const parsed = parseWorkspaceBackupJson(jsonText);
    if (parsed.masterProfile) {
      const mp = saveMasterProfile(
        parsed.masterProfile.rawText,
        parsed.masterProfile.fileName
      );
      setMasterProfile(mp);
    }
    saveApplicationsList(parsed.applications);
    setApplications(parsed.applications);
  };

  const displayScore = liveEvaluation?.atsScore ?? result?.atsScore ?? 0;
  const displayBreakdown =
    liveEvaluation?.scoreBreakdown ??
    result?.scoreBreakdown ?? {
      hardSkillsScore: 0,
      experienceAlignmentScore: 0,
      impactMetricsScore: 0,
      atsClarityScore: 0,
    };
  const displayPlaceholders =
    liveEvaluation?.unfilledPlaceholdersCount ??
    result?.unfilledPlaceholdersCount ??
    0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500/25 selection:text-blue-200">
      <Header
        historyCount={applications.length}
        hasMasterProfile={Boolean(masterProfile)}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
      />

      <WorkspaceDrawer
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        masterProfile={masterProfile}
        applications={applications}
        activeApplicationId={activeApplicationId}
        onSelectApplication={handleSelectApplication}
        onStatusChange={(id, status: ApplicationStatus) =>
          setApplications(updateApplicationStatus(id, status))
        }
        onDeleteApplication={(id) =>
          setApplications(deleteApplicationRecord(id))
        }
        onClearMasterProfile={() => {
          clearMasterProfile();
          setMasterProfile(null);
        }}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 space-y-10 sm:space-y-14">
        {/* Hero Section */}
        <div className="text-center space-y-4 sm:space-y-5 max-w-3xl mx-auto print:hidden">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-[11px] sm:text-xs font-mono backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
            <span className="text-blue-400 font-semibold">
              AstraCV V2 • Local-First ATS Workspace
            </span>
            <span className="text-zinc-500">•</span>
            <span className="hidden sm:inline">
              Gupy, Greenhouse, Lever & Workday
            </span>
            <span className="sm:hidden text-zinc-400">Gupy & ATS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.1]">
            Currículo de Tecnologia Calibrado para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400">
              Passar na Triagem
            </span>
          </h1>

          <p className="text-xs sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Motor híbrido determinístico + IA com revisão estilo Code Review, editor interativo A4 com recálculo de Score ao vivo e exportação limpa em DOCX, PDF e Texto Puro.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-[11px] sm:text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Score Antes vs Depois Ao Vivo</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Editor Inline & Code Review Diff</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Exportação DOCX, PDF A4 & Gupy</span>
            </div>
          </div>
        </div>

        {/* Etapa 1: Ingestão de Dados */}
        <section className="print:hidden">
          <InputSection
            resumeText={resumeText}
            jobDescription={jobDescription}
            atsPlatform={atsPlatform}
            targetLanguage={targetLanguage}
            onResumeTextChange={setResumeText}
            onJobDescriptionChange={setJobDescription}
            onAtsPlatformChange={setAtsPlatform}
            onTargetLanguageChange={setTargetLanguage}
            onOptimize={handleOptimize}
            masterProfile={masterProfile}
            onSaveMasterProfile={(text, fileName) => {
              const mp = saveMasterProfile(text, fileName);
              setMasterProfile(mp);
            }}
            onLoadMasterProfile={() => {
              if (masterProfile) setResumeText(masterProfile.rawText);
            }}
            isLoading={isLoading}
            error={error}
          />
        </section>

        {/* Etapa 2: Workspace Interativo de Diagnóstico, Editor A4, Diff e Entrevista */}
        {result && editedResume && (
          <section ref={resultsRef} className="space-y-6 pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-white/[0.07] print:hidden">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                    02
                  </span>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Workspace de Calibração & Editor ATS
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold">
                    Score Live: {displayScore}%
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Edite o currículo ou revise o Diff — o índice de aderência ATS é recalculado em tempo real.
                </p>
              </div>

              {/* Segmented Control de 4 Abas */}
              <div className="flex bg-black/40 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/10 text-xs font-medium overflow-x-auto no-scrollbar w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className={`inline-flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 py-2 min-h-[38px] rounded-lg sm:rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-none ${
                    activeTab === "dashboard"
                      ? "bg-zinc-800 text-white font-semibold shadow-inner"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Score & Vaga</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("resume")}
                  className={`inline-flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 py-2 min-h-[38px] rounded-lg sm:rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-none ${
                    activeTab === "resume"
                      ? "bg-zinc-800 text-white font-semibold shadow-inner"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Editor & Exportar</span>
                  {displayPlaceholders > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("diff")}
                  className={`inline-flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 py-2 min-h-[38px] rounded-lg sm:rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-none ${
                    activeTab === "diff"
                      ? "bg-zinc-800 text-white font-semibold shadow-inner"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    Code Review Diff ({result.improvements?.length || 0})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("interview")}
                  className={`inline-flex items-center justify-center space-x-1.5 px-3 sm:px-3.5 py-2 min-h-[38px] rounded-lg sm:rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-none ${
                    activeTab === "interview"
                      ? "bg-zinc-800 text-white font-semibold shadow-inner"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <MessageSquareCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Entrevista & LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Conteúdo Dinâmico */}
            <div>
              {activeTab === "dashboard" && (
                <ScoreDashboard
                  result={{
                    ...result,
                    matchedKeywords:
                      liveEvaluation?.matchedKeywords ?? result.matchedKeywords,
                    missingKeywords:
                      liveEvaluation?.missingKeywords ?? result.missingKeywords,
                    missingDesiredKeywords:
                      liveEvaluation?.missingDesiredKeywords ??
                      result.missingDesiredKeywords,
                    keywordDetails:
                      liveEvaluation?.keywordDetails ?? result.keywordDetails,
                  }}
                  liveAtsScore={displayScore}
                  liveBreakdown={displayBreakdown}
                  liveUnfilledPlaceholders={displayPlaceholders}
                  isDemo={isDemo}
                  onJumpToEditor={() => setActiveTab("resume")}
                />
              )}

              {activeTab === "resume" && (
                <ResumeViewer
                  resume={editedResume}
                  layoutConfig={layoutConfig}
                  onResumeChange={(nextResume) =>
                    syncActiveSession(nextResume, layoutConfig)
                  }
                  onLayoutConfigChange={(nextLayout) =>
                    syncActiveSession(editedResume, nextLayout)
                  }
                  onResetToCalibrated={() =>
                    syncActiveSession(
                      structuredClone(result.optimizedResume),
                      layoutConfig
                    )
                  }
                />
              )}

              {activeTab === "diff" && (
                <DiffViewer
                  improvements={result.improvements}
                  onDecisionChange={handleDiffDecision}
                  onBulkDecision={handleBulkDiffDecision}
                />
              )}

              {activeTab === "interview" && (
                <InterviewPrepPanel
                  interviewPrep={result.interviewPrep}
                  roleTitle={result.jobAnalysis?.roleTitle}
                />
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-zinc-500 print:hidden mt-auto">
        <p>
          AstraCV V2 — Workspace Local-First de Engenharia de Perfil Técnico para Sistemas ATS.
        </p>
      </footer>
    </div>
  );
}
