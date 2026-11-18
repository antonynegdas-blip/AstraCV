"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Briefcase,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Code2,
  FileUp,
  X,
  ArrowRight,
  ShieldAlert,
  Bookmark,
  BookmarkCheck,
  SlidersHorizontal,
  Globe2,
  AlertTriangle,
} from "lucide-react";
import { SAMPLE_RESUME, SAMPLE_JOB } from "@/lib/sampleData";
import { AtsPlatform, TargetLanguage } from "@/types/resume";
import { MasterProfile } from "@/types/workspace";

interface InputSectionProps {
  resumeText: string;
  jobDescription: string;
  atsPlatform: AtsPlatform;
  targetLanguage: TargetLanguage;
  onResumeTextChange: (val: string) => void;
  onJobDescriptionChange: (val: string) => void;
  onAtsPlatformChange: (val: AtsPlatform) => void;
  onTargetLanguageChange: (val: TargetLanguage) => void;
  onOptimize: (forceDemo?: boolean) => Promise<void>;
  masterProfile: MasterProfile | null;
  onSaveMasterProfile: (text: string, fileName?: string) => void;
  onLoadMasterProfile: () => void;
  isLoading: boolean;
  error: string | null;
}

const LOADING_STEPS = [
  "1/4 • Extraindo estrutura do currículo e histórico...",
  "2/4 • Mapeando requisitos obrigatórios e diferenciais da vaga...",
  "3/4 • Calculando Score Determinístico & Reescrevendo no padrão Google XYZ...",
  "4/4 • Gerando Diff de revisão e roteiro para entrevista técnica...",
];

export function InputSection({
  resumeText,
  jobDescription,
  atsPlatform,
  targetLanguage,
  onResumeTextChange,
  onJobDescriptionChange,
  onAtsPlatformChange,
  onTargetLanguageChange,
  onOptimize,
  masterProfile,
  onSaveMasterProfile,
  onLoadMasterProfile,
  isLoading,
  error,
}: InputSectionProps) {
  const [activeResumeTab, setActiveResumeTab] = useState<"text" | "file">("text");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMasterFeedback, setSavedMasterFeedback] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setLoadingStepIndex((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1800);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isAllowed =
      lower.endsWith(".pdf") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".txt") ||
      lower.endsWith(".md");

    if (!isAllowed) {
      setUploadError(
        "Formato não suportado. Selecione um arquivo .PDF, .DOCX, .TXT ou .MD."
      );
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      setUploadError("O arquivo excede o limite de 4.5MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadWarnings([]);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao extrair texto do documento.");
      }

      onResumeTextChange(data.text);
      setUploadedFileName(
        `${data.fileName || file.name}${
          data.pageCount > 1 ? ` (${data.pageCount} págs)` : ""
        }${data.usedOcr ? " • OCR Multimodal" : ""}`
      );
      setUploadWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setActiveResumeTab("text");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro no upload do arquivo.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLoadSample = () => {
    onResumeTextChange(SAMPLE_RESUME);
    onJobDescriptionChange(SAMPLE_JOB);
    setUploadedFileName(null);
    setUploadWarnings([]);
    setUploadError(null);
  };

  const handleClear = () => {
    onResumeTextChange("");
    onJobDescriptionChange("");
    setUploadedFileName(null);
    setUploadWarnings([]);
    setUploadError(null);
  };

  const handleSaveAsMaster = () => {
    if (resumeText.trim().length < 50) return;
    onSaveMasterProfile(resumeText, uploadedFileName || "Currículo Base");
    setSavedMasterFeedback(true);
    setTimeout(() => setSavedMasterFeedback(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) return;
    setLoadingStepIndex(0);
    onOptimize(false);
  };

  const isReady =
    resumeText.trim().length >= 50 && jobDescription.trim().length >= 30;

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/25 via-indigo-500/15 to-cyan-500/25 rounded-[2.5rem] blur-xl opacity-60 group-hover:opacity-85 transition duration-1000 -z-10" />

      <div className="bg-zinc-900/90 border border-white/10 rounded-2xl sm:rounded-[2.2rem] p-1.5 sm:p-3 shadow-2xl backdrop-blur-2xl">
        <div className="bg-zinc-950/90 border border-white/[0.06] rounded-xl sm:rounded-[1.8rem] p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-white/[0.07]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                  01
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Ingestão & Parâmetros de Calibração ATS
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Importe seu currículo (.PDF, .DOCX ou Master Profile), cole a vaga e escolha o perfil de triagem.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end pt-1 sm:pt-0">
              {masterProfile && (
                <button
                  type="button"
                  onClick={onLoadMasterProfile}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition cursor-pointer"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Usar Master Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 border border-white/10 hover:border-blue-500/40 transition cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Carregar Exemplo Dev</span>
              </button>

              {(resumeText || jobDescription) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 min-h-[36px] text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Barra de Configuração: Plataforma ATS + Idioma Alvo */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>Algoritmo da Plataforma ATS Alvo</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    { id: "general", label: "Universal" },
                    { id: "gupy", label: "Gupy / BR" },
                    { id: "greenhouse", label: "Greenhouse" },
                    { id: "workday", label: "Workday" },
                  ] as { id: AtsPlatform; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onAtsPlatformChange(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      atsPlatform === item.id
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                <Globe2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Idioma do Currículo Calibrado</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "auto", label: "Automático" },
                    { id: "pt-BR", label: "Português (BR)" },
                    { id: "en-US", label: "Inglês (EN-US)" },
                  ] as { id: TargetLanguage; label: string }[]
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => onTargetLanguageChange(lang.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      targetLanguage === lang.id
                        ? "bg-sky-500/20 border-sky-400/50 text-sky-200 font-semibold"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas de Diagnóstico do PDF/DOCX */}
          {uploadWarnings.length > 0 && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1 text-xs text-amber-200">
              {uploadWarnings.map((w, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Feedback de Erro com Ação de Recuperação (ui-states) */}
          {error && (
            <div className="mt-5 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200 text-xs">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Falha na Análise</p>
                  <p className="mt-0.5 text-red-200/90">{error}</p>
                </div>
              </div>
              {isReady && (
                <button
                  type="button"
                  onClick={() => onOptimize(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-100 font-medium whitespace-nowrap cursor-pointer"
                >
                  Simular com Motor Híbrido Local
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Card 1: Currículo */}
              <div className="flex flex-col space-y-3 bg-zinc-900/60 border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-white/10 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-zinc-200">
                      Currículo Original
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {resumeText.trim().length >= 50 && (
                      <button
                        type="button"
                        onClick={handleSaveAsMaster}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] text-zinc-300 transition cursor-pointer"
                        title="Salva este currículo no seu navegador para reutilizar em outras vagas"
                      >
                        {savedMasterFeedback ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">
                              Salvo!
                            </span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3 text-blue-400" />
                            <span className="hidden sm:inline">
                              Salvar Master
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setActiveResumeTab("text")}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          activeResumeTab === "text"
                            ? "bg-zinc-800 text-white font-semibold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Texto
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveResumeTab("file")}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          activeResumeTab === "file"
                            ? "bg-zinc-800 text-white font-semibold"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        PDF / DOCX
                      </button>
                    </div>
                  </div>
                </div>

                {activeResumeTab === "file" ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-5 sm:p-8 text-center bg-black/20 hover:bg-black/30 hover:border-blue-500/30 transition min-h-[220px] sm:min-h-[280px]">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="doc-upload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="doc-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-3 w-full"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-white/10 flex items-center justify-center text-blue-400 shadow-inner">
                        {isUploading ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileUp className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {isUploading
                            ? "Extraindo e validando documento..."
                            : "Clique para enviar PDF, DOCX ou TXT"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Suporta .PDF (com OCR Multimodal), .DOCX (Word) e .TXT até 4.5MB
                        </p>
                      </div>
                    </label>

                    {uploadError && (
                      <p className="mt-3 text-xs text-red-400 font-medium">
                        {uploadError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-2">
                    {uploadedFileName && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                        <div className="flex items-center space-x-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                          <span className="truncate">
                            Documento: {uploadedFileName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFileName(null)}
                          className="hover:text-blue-200 ml-2 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <textarea
                      value={resumeText}
                      onChange={(e) => onResumeTextChange(e.target.value)}
                      placeholder="Cole seu currículo atual ou importe um arquivo PDF/DOCX na aba ao lado..."
                      className="w-full h-52 sm:h-64 lg:h-72 p-3.5 sm:p-4 text-base sm:text-xs font-mono rounded-xl border border-white/[0.08] bg-black/40 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 transition resize-none leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[11px] text-zinc-500 px-1">
                      <span>Mínimo 50 caracteres</span>
                      <span className="font-mono">
                        {resumeText.length} caracteres
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Vaga Alvo */}
              <div className="flex flex-col space-y-3 bg-zinc-900/60 border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-white/10 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold text-zinc-200">
                      Descrição da Vaga Alvo
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Requisitos, Stack & Atribuições
                  </span>
                </div>

                <div className="flex-1 flex flex-col space-y-2">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => onJobDescriptionChange(e.target.value)}
                    placeholder="Cole a descrição completa da vaga (requisitos obrigatórios, diferenciais, stacks e responsabilidades)..."
                    className="w-full h-52 sm:h-64 lg:h-72 p-3.5 sm:p-4 text-base sm:text-xs font-sans rounded-xl border border-white/[0.08] bg-black/40 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500/60 focus:border-sky-500/60 transition resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 px-1">
                    <span>Mínimo 30 caracteres</span>
                    <span className="font-mono">
                      {jobDescription.length} caracteres
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ação Principal & Progresso */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.07]">
              <div className="text-xs text-zinc-400 flex items-center space-x-2 text-center sm:text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span>
                  {isLoading
                    ? LOADING_STEPS[loadingStepIndex]
                    : "Motor híbrido: Score determinístico + Reescrita Google XYZ + Editor A4"}
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isReady}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 sm:px-8 py-3.5 min-h-[48px] rounded-xl font-medium text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:brightness-110 shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition transform active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span className="font-semibold">
                      Calibrando Currículo...
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span className="font-semibold">
                      Analisar & Calibrar Currículo
                    </span>
                    <ArrowRight className="w-4 h-4 text-white ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
