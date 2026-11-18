"use client";

import React, { useState } from "react";
import { ResumeData, SectionKey } from "@/types/resume";
import { ResumeLayoutConfig } from "@/types/workspace";
import { sanitizeExternalUrl } from "@/lib/security/url";
import {
  generateDocxBlob,
  generateGupyBlocks,
  generateJsonResume,
  generateMarkdown,
  generatePlainText,
} from "@/lib/export/exporters";
import {
  Copy,
  Printer,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  FileDown,
  Edit3,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Sliders,
  ClipboardList,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Resumo Profissional",
  skills: "Competências Técnicas",
  experiences: "Experiência Profissional",
  projects: "Projetos Relevantes",
  education: "Formação Acadêmica",
  certifications: "Certificações",
  languages: "Idiomas",
};

const PLACEHOLDER_TOKEN_REGEX =
  /(\[(?:ex|exemplo|inserir|adicione|preencher|metric|métrica|x%|y%)[^\]]*\])/gi;

interface ResumeViewerProps {
  resume: ResumeData;
  layoutConfig: ResumeLayoutConfig;
  onResumeChange: (updated: ResumeData) => void;
  onLayoutConfigChange: (updated: ResumeLayoutConfig) => void;
  onResetToCalibrated?: () => void;
}

export function ResumeViewer({
  resume,
  layoutConfig,
  onResumeChange,
  onLayoutConfigChange,
  onResetToCalibrated,
}: ResumeViewerProps) {
  const [isEditMode, setIsEditMode] = useState(true);
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);
  const [showGupyModal, setShowGupyModal] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [activePlaceholderEdit, setActivePlaceholderEdit] = useState<{
    expIdx: number;
    bulletIdx: number;
    token: string;
    value: string;
  } | null>(null);

  const exportOpts = {
    sectionOrder: layoutConfig.sectionOrder,
    hiddenSections: layoutConfig.hiddenSections,
    fontSizePt: layoutConfig.fontSizePt,
  };

  const triggerCopied = (key: string) => {
    setCopiedType(key);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyPlainText = () => {
    const text = generatePlainText(resume, exportOpts);
    navigator.clipboard.writeText(text);
    triggerCopied("plain");
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown(resume, exportOpts);
    navigator.clipboard.writeText(md);
    triggerCopied("markdown");
  };

  const handleDownloadJsonResume = () => {
    const json = generateJsonResume(resume);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.fullName.toLowerCase().replace(/\s+/g, "-")}-jsonresume.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerCopied("json");
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      const blob = await generateDocxBlob(resume, exportOpts);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.fullName.toLowerCase().replace(/\s+/g, "-")}-ats.docx`;
      a.click();
      URL.revokeObjectURL(url);
      triggerCopied("docx");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const moveSection = (section: SectionKey, dir: -1 | 1) => {
    const list = [...layoutConfig.sectionOrder];
    const idx = list.indexOf(section);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    onLayoutConfigChange({ ...layoutConfig, sectionOrder: list });
  };

  const toggleSectionVisibility = (section: SectionKey) => {
    const hidden = new Set(layoutConfig.hiddenSections);
    if (hidden.has(section)) {
      hidden.delete(section);
    } else {
      hidden.add(section);
    }
    onLayoutConfigChange({
      ...layoutConfig,
      hiddenSections: Array.from(hidden),
    });
  };

  const applyPlaceholderValue = () => {
    if (!activePlaceholderEdit) return;
    const { expIdx, bulletIdx, token, value } = activePlaceholderEdit;
    if (!value.trim()) return;
    const next = structuredClone(resume);
    const currentBullet = next.experiences[expIdx]?.bullets?.[bulletIdx];
    if (currentBullet) {
      next.experiences[expIdx].bullets[bulletIdx] = currentBullet.replace(
        token,
        value.trim()
      );
      onResumeChange(next);
    }
    setActivePlaceholderEdit(null);
  };

  const densityPadding =
    layoutConfig.density === "compact"
      ? "p-4 sm:p-7 md:p-9 space-y-3.5"
      : layoutConfig.density === "spacious"
      ? "p-5 sm:p-10 md:p-14 space-y-6"
      : "p-4 sm:p-8 md:p-12 space-y-5";

  const fontSizeClass =
    layoutConfig.fontSizePt === 10
      ? "text-[11.5px] leading-snug"
      : layoutConfig.fontSizePt === 11
      ? "text-[13.5px] leading-relaxed"
      : "text-xs sm:text-[12.5px] leading-relaxed";

  const activeSections = layoutConfig.sectionOrder.filter(
    (s) => !layoutConfig.hiddenSections.includes(s)
  );

  const gupyBlocks = generateGupyBlocks(resume);

  return (
    <div className="space-y-5">
      {/* Barra de Ações & Exportação V2 */}
      <div className="sticky top-14 sm:top-16 z-40 flex flex-col gap-3 p-3 sm:p-4 bg-zinc-900/95 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Toggle Modo Edição vs Preview + Layout */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-medium">
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  isEditMode
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor Interativo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  !isEditMode
                    ? "bg-zinc-800 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Folha A4 Limpa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowLayoutPanel((v) => !v)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium border transition cursor-pointer ${
                showLayoutPanel
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-zinc-300"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Diagramação & Seções</span>
            </button>

            {onResetToCalibrated && (
              <button
                type="button"
                onClick={onResetToCalibrated}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs text-zinc-400 hover:text-zinc-200 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition cursor-pointer"
                title="Desfazer edições manuais e voltar à versão calibrada original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resetar Edições</span>
              </button>
            )}
          </div>

          {/* Botões de Exportação Real */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowGupyModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo Gupy / Workday</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPlainText}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-200 transition cursor-pointer"
              title="Copia texto 100% puro sem símbolos Markdown"
            >
              {copiedType === "plain" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">
                    Texto Copiado!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Texto Puro</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-200 transition cursor-pointer"
            >
              {copiedType === "markdown" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">MD!</span>
                </>
              ) : (
                <span>.MD</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJsonResume}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-200 transition cursor-pointer"
              title="Exportar no padrão aberto JSON Resume"
            >
              <span>.JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-sky-600/20 hover:bg-sky-600/30 border border-sky-400/40 text-sky-200 transition cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span>{isExportingDocx ? "Gerando..." : "Baixar .DOCX"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>PDF A4</span>
            </button>
          </div>
        </div>

        {/* Painel Expansível de Diagramação A4 & Ordem de Seções */}
        {showLayoutPanel && (
          <div className="pt-3 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
            <div className="lg:col-span-5 space-y-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Densidade & Espaçamento A4
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "compact", label: "Compacto (1 Pág)" },
                      { id: "balanced", label: "Balanceado" },
                      { id: "spacious", label: "Espaçoso" },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        onLayoutConfigChange({
                          ...layoutConfig,
                          density: d.id,
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                        layoutConfig.density === d.id
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold"
                          : "bg-black/40 border-white/10 text-zinc-400"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Corpo da Fonte
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {([10, 10.5, 11] as const).map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() =>
                          onLayoutConfigChange({
                            ...layoutConfig,
                            fontSizePt: pt,
                          })
                        }
                        className={`py-1 rounded-lg border font-mono cursor-pointer ${
                          layoutConfig.fontSizePt === pt
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-bold"
                            : "bg-black/40 border-white/10 text-zinc-400"
                        }`}
                      >
                        {pt}pt
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Meta de Página
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {([1, 2] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          onLayoutConfigChange({
                            ...layoutConfig,
                            pageTarget: p,
                          })
                        }
                        className={`py-1 rounded-lg border cursor-pointer ${
                          layoutConfig.pageTarget === p
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold"
                            : "bg-black/40 border-white/10 text-zinc-400"
                        }`}
                      >
                        {p} {p === 1 ? "Página" : "Páginas"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Ordem & Visibilidade das Seções (Reordene para destacar pontos fortes)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {layoutConfig.sectionOrder.map((sec, idx) => {
                  const isHidden = layoutConfig.hiddenSections.includes(sec);
                  return (
                    <div
                      key={sec}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                        isHidden
                          ? "bg-black/20 border-white/5 text-zinc-500"
                          : "bg-black/40 border-white/10 text-zinc-200"
                      }`}
                    >
                      <span className="truncate font-medium">
                        {idx + 1}. {SECTION_LABELS[sec]}
                      </span>
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveSection(sec, -1)}
                          disabled={idx === 0}
                          className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Subir seção"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(sec, 1)}
                          disabled={
                            idx === layoutConfig.sectionOrder.length - 1
                          }
                          className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Descer seção"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionVisibility(sec)}
                          className="p-1 hover:text-amber-300 cursor-pointer"
                          title={isHidden ? "Mostrar seção" : "Ocultar seção"}
                        >
                          {isHidden ? (
                            <EyeOff className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Eye className="w-3 h-3 text-emerald-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popover de Preenchimento Rápido de Placeholder */}
      {activePlaceholderEdit && (
        <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-400/50 text-xs text-amber-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl print:hidden">
          <div className="space-y-1">
            <span className="font-semibold text-amber-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Substituir Placeholder: {activePlaceholderEdit.token}
              </span>
            </span>
            <p className="text-amber-200/80">
              Informe o número ou impacto real (ex: &quot;redução de 35% na latência&quot;) para substituir no currículo e subir seu Score ATS.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activePlaceholderEdit.value}
              onChange={(e) =>
                setActivePlaceholderEdit({
                  ...activePlaceholderEdit,
                  value: e.target.value,
                })
              }
              placeholder="Ex: redução de 38% no tempo de resposta"
              className="px-3 py-1.5 rounded-lg bg-black/60 border border-amber-400/50 text-white text-xs min-w-[230px] focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={applyPlaceholderValue}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold cursor-pointer"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setActivePlaceholderEdit(null)}
              className="p-1.5 text-amber-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Folha do Currículo A4 (Interativa ou Preview Limpo) */}
      <div className="relative">
        <div
          id="resume-sheet"
          className={`bg-white text-zinc-900 ${densityPadding} ${fontSizeClass} rounded-xl sm:rounded-2xl border border-zinc-200/80 shadow-2xl font-sans max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none relative`}
        >
          {/* Cabeçalho do Candidato */}
          <header className="border-b-2 border-zinc-900 pb-4 mb-4 text-center">
            {isEditMode ? (
              <div className="space-y-2 print:hidden">
                <input
                  type="text"
                  value={resume.fullName}
                  onChange={(e) =>
                    onResumeChange({ ...resume, fullName: e.target.value })
                  }
                  className="w-full text-center text-xl sm:text-2xl font-black uppercase text-zinc-950 bg-blue-50/60 hover:bg-blue-50 focus:bg-white border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SEU NOME COMPLETO"
                />
                <input
                  type="text"
                  value={resume.headline}
                  onChange={(e) =>
                    onResumeChange({ ...resume, headline: e.target.value })
                  }
                  className="w-full text-center text-xs sm:text-sm font-semibold text-zinc-800 bg-blue-50/60 hover:bg-blue-50 focus:bg-white border border-blue-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título Profissional | Stack Principal"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                  <input
                    type="text"
                    value={resume.location || ""}
                    onChange={(e) =>
                      onResumeChange({ ...resume, location: e.target.value })
                    }
                    placeholder="Cidade, UF (Remoto)"
                    className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 text-zinc-800"
                  />
                  <input
                    type="text"
                    value={resume.email || ""}
                    onChange={(e) =>
                      onResumeChange({ ...resume, email: e.target.value })
                    }
                    placeholder="email@dominio.com"
                    className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 text-zinc-800"
                  />
                  <input
                    type="text"
                    value={resume.phone || ""}
                    onChange={(e) =>
                      onResumeChange({ ...resume, phone: e.target.value })
                    }
                    placeholder="+55 (11) 99999-9999"
                    className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 text-zinc-800"
                  />
                  <input
                    type="text"
                    value={resume.linkedinUrl || ""}
                    onChange={(e) =>
                      onResumeChange({ ...resume, linkedinUrl: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 text-zinc-800"
                  />
                  <input
                    type="text"
                    value={resume.githubUrl || ""}
                    onChange={(e) =>
                      onResumeChange({ ...resume, githubUrl: e.target.value })
                    }
                    placeholder="https://github.com/..."
                    className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 text-zinc-800"
                  />
                  <input
                    type="text"
                    value={resume.portfolioUrl || ""}
                    onChange={(e) =>
                      onResumeChange({
                        ...resume,
                        portfolioUrl: e.target.value,
                      })
                    }
                    placeholder="https://meuportfolio.dev"
                    className="px-2 py-1 rounded border border-zinc-300 bg-zinc-50 text-zinc-800"
                  />
                </div>
              </div>
            ) : null}

            {/* Renderização Limpa (sempre usada na impressão e no Modo Folha Limpa) */}
            <div className={isEditMode ? "hidden print:block" : "block"}>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-zinc-950 uppercase">
                {resume.fullName}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-zinc-800 mt-1 tracking-wide">
                {resume.headline}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2.5 text-[11px] sm:text-xs text-zinc-600 font-medium">
                {resume.location && (
                  <span className="inline-flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    <span>{resume.location}</span>
                  </span>
                )}
                {resume.email && (
                  <span className="inline-flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-zinc-400" />
                    <span>{resume.email}</span>
                  </span>
                )}
                {resume.phone && (
                  <span className="inline-flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-zinc-400" />
                    <span>{resume.phone}</span>
                  </span>
                )}
                {sanitizeExternalUrl(resume.linkedinUrl) && (
                  <a
                    href={sanitizeExternalUrl(resume.linkedinUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-zinc-800 hover:underline"
                  >
                    <span>LinkedIn</span>
                  </a>
                )}
                {sanitizeExternalUrl(resume.githubUrl) && (
                  <a
                    href={sanitizeExternalUrl(resume.githubUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-zinc-800 hover:underline"
                  >
                    <span>GitHub</span>
                  </a>
                )}
                {sanitizeExternalUrl(resume.portfolioUrl) && (
                  <a
                    href={sanitizeExternalUrl(resume.portfolioUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-zinc-800 hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Portfólio</span>
                  </a>
                )}
              </div>
            </div>
          </header>

          {/* Renderização Dinâmica das Seções na Ordem Configurada */}
          {activeSections.map((sectionKey) => {
            if (sectionKey === "summary") {
              return (
                <section key="summary" className="print-avoid-break">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-1 mb-2">
                    Resumo Profissional
                  </h2>
                  {isEditMode ? (
                    <textarea
                      value={resume.summary}
                      onChange={(e) =>
                        onResumeChange({ ...resume, summary: e.target.value })
                      }
                      rows={3}
                      className="w-full p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 focus:bg-white border border-blue-200 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 print:hidden"
                    />
                  ) : null}
                  <p
                    className={`text-zinc-800 text-left sm:text-justify ${
                      isEditMode ? "hidden print:block" : "block"
                    }`}
                  >
                    {resume.summary}
                  </p>
                </section>
              );
            }

            if (sectionKey === "skills") {
              return (
                <section key="skills" className="print-avoid-break">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-200 pb-1 mb-2">
                    Competências Técnicas
                  </h2>
                  {isEditMode ? (
                    <div className="space-y-2 print:hidden">
                      {(
                        [
                          {
                            key: "technical",
                            label: "Linguagens & Tecnologias",
                          },
                          {
                            key: "domain",
                            label: "Práticas & Metodologias",
                          },
                          {
                            key: "tools",
                            label: "Ferramentas & DevOps",
                          },
                        ] as const
                      ).map((cat) => (
                        <div
                          key={cat.key}
                          className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                        >
                          <strong className="text-zinc-900 min-w-[180px]">
                            {cat.label}:
                          </strong>
                          <input
                            type="text"
                            value={(resume.skills[cat.key] || []).join(", ")}
                            onChange={(e) =>
                              onResumeChange({
                                ...resume,
                                skills: {
                                  ...resume.skills,
                                  [cat.key]: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                },
                              })
                            }
                            placeholder="Separe por vírgula..."
                            className="flex-1 px-2.5 py-1 rounded-lg bg-blue-50/50 border border-blue-200 text-zinc-800 focus:bg-white focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className={`space-y-1.5 ${
                      isEditMode ? "hidden print:block" : "block"
                    }`}
                  >
                    {resume.skills.technical?.length > 0 && (
                      <div>
                        <strong className="text-zinc-950">
                          Linguagens & Tecnologias:{" "}
                        </strong>
                        <span className="text-zinc-700">
                          {resume.skills.technical.join(" • ")}
                        </span>
                      </div>
                    )}
                    {resume.skills.domain?.length > 0 && (
                      <div>
                        <strong className="text-zinc-950">
                          Práticas & Metodologias:{" "}
                        </strong>
                        <span className="text-zinc-700">
                          {resume.skills.domain.join(" • ")}
                        </span>
                      </div>
                    )}
                    {resume.skills.tools?.length > 0 && (
                      <div>
                        <strong className="text-zinc-950">
                          Ferramentas & DevOps:{" "}
                        </strong>
                        <span className="text-zinc-700">
                          {resume.skills.tools.join(" • ")}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            if (sectionKey === "experiences") {
              return (
                <section key="experiences">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                      Experiência Profissional
                    </h2>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          onResumeChange({
                            ...resume,
                            experiences: [
                              ...resume.experiences,
                              {
                                company: "Nome da Empresa",
                                role: "Cargo Técnico",
                                period: "Jan 2023 - Atual",
                                location: "Remoto",
                                technologies: ["TypeScript"],
                                bullets: [
                                  "Implementei [ação técnica] utilizando [stack], resultando em [ex: melhoria de X%].",
                                ],
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 print:hidden cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Experiência</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {resume.experiences.map((exp, expIdx) => (
                      <div
                        key={expIdx}
                        className="space-y-1.5 print-avoid-break"
                      >
                        {isEditMode ? (
                          <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 print:hidden">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) => {
                                  const next = structuredClone(resume);
                                  next.experiences[expIdx].role =
                                    e.target.value;
                                  onResumeChange(next);
                                }}
                                placeholder="Cargo"
                                className="font-bold text-zinc-950 px-2 py-1 rounded border border-zinc-300 bg-white flex-1 min-w-[160px]"
                              />
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => {
                                  const next = structuredClone(resume);
                                  next.experiences[expIdx].company =
                                    e.target.value;
                                  onResumeChange(next);
                                }}
                                placeholder="Empresa"
                                className="text-zinc-800 px-2 py-1 rounded border border-zinc-300 bg-white flex-1 min-w-[140px]"
                              />
                              <input
                                type="text"
                                value={exp.period}
                                onChange={(e) => {
                                  const next = structuredClone(resume);
                                  next.experiences[expIdx].period =
                                    e.target.value;
                                  onResumeChange(next);
                                }}
                                placeholder="Período"
                                className="text-zinc-600 px-2 py-1 rounded border border-zinc-300 bg-white w-36"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = structuredClone(resume);
                                  next.experiences.splice(expIdx, 1);
                                  onResumeChange(next);
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Remover experiência"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={(exp.technologies || []).join(", ")}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.experiences[expIdx].technologies =
                                  e.target.value
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean);
                                onResumeChange(next);
                              }}
                              placeholder="Tecnologias usadas (separadas por vírgula)"
                              className="w-full text-[11px] italic text-zinc-600 px-2 py-1 rounded border border-zinc-200 bg-white"
                            />

                            <div className="space-y-1.5 pt-1">
                              {exp.bullets.map((b, bIdx) => {
                                const placeholderMatch = b.match(
                                  PLACEHOLDER_TOKEN_REGEX
                                );
                                return (
                                  <div
                                    key={bIdx}
                                    className="space-y-1"
                                  >
                                    <div className="flex items-start gap-1.5">
                                      <span className="text-zinc-400 mt-1.5">
                                        •
                                      </span>
                                      <textarea
                                        value={b}
                                        onChange={(e) => {
                                          const next = structuredClone(resume);
                                          next.experiences[expIdx].bullets[
                                            bIdx
                                          ] = e.target.value;
                                          onResumeChange(next);
                                        }}
                                        rows={2}
                                        className={`flex-1 p-1.5 rounded border text-zinc-800 focus:outline-none ${
                                          placeholderMatch
                                            ? "border-amber-400 bg-amber-50/70"
                                            : "border-zinc-200 bg-white"
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = structuredClone(resume);
                                          next.experiences[
                                            expIdx
                                          ].bullets.splice(bIdx, 1);
                                          onResumeChange(next);
                                        }}
                                        className="p-1 text-zinc-400 hover:text-rose-600 mt-1 cursor-pointer"
                                        title="Remover realização"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {placeholderMatch && (
                                      <div className="pl-4 flex flex-wrap gap-1.5">
                                        {placeholderMatch.map((tok, tIdx) => (
                                          <button
                                            key={tIdx}
                                            type="button"
                                            onClick={() =>
                                              setActivePlaceholderEdit({
                                                expIdx,
                                                bulletIdx: bIdx,
                                                token: tok,
                                                value: "",
                                              })
                                            }
                                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 text-[11px] font-semibold cursor-pointer"
                                          >
                                            <Sparkles className="w-3 h-3 text-amber-600" />
                                            <span>
                                              Preencher métrica: {tok}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = structuredClone(resume);
                                  next.experiences[expIdx].bullets.push(
                                    "Desenvolvi [funcionalidade] com [tecnologia], alcançando [métrica]."
                                  );
                                  onResumeChange(next);
                                }}
                                className="inline-flex items-center space-x-1 text-[11px] font-medium text-blue-600 hover:underline pl-4 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Adicionar bullet de impacto</span>
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {/* Visualização Limpa & Impressão */}
                        <div
                          className={
                            isEditMode ? "hidden print:block" : "block"
                          }
                        >
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                            <div className="font-bold text-zinc-950">
                              {exp.role}{" "}
                              <span className="font-normal text-zinc-600">
                                | {exp.company}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500 font-medium">
                              {exp.period}{" "}
                              {exp.location ? `• ${exp.location}` : ""}
                            </div>
                          </div>

                          {exp.technologies && exp.technologies.length > 0 && (
                            <div className="text-[11px] text-zinc-600 italic pb-0.5 font-medium">
                              Tecnologias: {exp.technologies.join(", ")}
                            </div>
                          )}

                          <ul className="list-disc list-outside pl-4 space-y-1 text-zinc-800">
                            {exp.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (sectionKey === "projects") {
              if (!isEditMode && (!resume.projects || resume.projects.length === 0)) {
                return null;
              }
              return (
                <section key="projects" className="print-avoid-break">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-2">
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                      Projetos Relevantes
                    </h2>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          onResumeChange({
                            ...resume,
                            projects: [
                              ...(resume.projects || []),
                              {
                                name: "Novo Projeto",
                                description:
                                  "Descrição objetiva da arquitetura e problema resolvido.",
                                technologies: ["TypeScript", "Next.js"],
                                url: "",
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 print:hidden cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Projeto</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(resume.projects || []).map((proj, idx) => (
                      <div key={idx}>
                        {isEditMode ? (
                          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 print:hidden">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={proj.name}
                                onChange={(e) => {
                                  const next = structuredClone(resume);
                                  next.projects[idx].name = e.target.value;
                                  onResumeChange(next);
                                }}
                                placeholder="Nome do Projeto"
                                className="font-bold text-zinc-950 px-2 py-1 rounded border border-zinc-300 bg-white flex-1"
                              />
                              <input
                                type="text"
                                value={proj.url || ""}
                                onChange={(e) => {
                                  const next = structuredClone(resume);
                                  next.projects[idx].url = e.target.value;
                                  onResumeChange(next);
                                }}
                                placeholder="URL (GitHub / Deploy)"
                                className="text-zinc-600 px-2 py-1 rounded border border-zinc-300 bg-white flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = structuredClone(resume);
                                  next.projects.splice(idx, 1);
                                  onResumeChange(next);
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={proj.description}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.projects[idx].description = e.target.value;
                                onResumeChange(next);
                              }}
                              rows={2}
                              className="w-full p-1.5 rounded border border-zinc-200 bg-white text-zinc-800"
                            />
                          </div>
                        ) : null}

                        <div
                          className={
                            isEditMode ? "hidden print:block" : "block"
                          }
                        >
                          <div className="flex items-center space-x-2 font-bold text-zinc-950">
                            <span>{proj.name}</span>
                            {sanitizeExternalUrl(proj.url) && (
                              <a
                                href={sanitizeExternalUrl(proj.url)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-700 hover:underline font-normal inline-flex items-center text-[11px]"
                              >
                                <ExternalLink className="w-2.5 h-2.5 ml-1" />
                              </a>
                            )}
                          </div>
                          <p className="text-zinc-700 mt-0.5">
                            {proj.description}
                          </p>
                          {proj.technologies &&
                            proj.technologies.length > 0 && (
                              <p className="text-[11px] text-zinc-500 italic mt-0.5">
                                Stack: {proj.technologies.join(", ")}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (sectionKey === "education") {
              return (
                <section key="education" className="print-avoid-break">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-2">
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                      Formação Acadêmica
                    </h2>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          onResumeChange({
                            ...resume,
                            education: [
                              ...resume.education,
                              {
                                degree: "Curso / Graduação",
                                institution: "Instituição",
                                year: "2020 - 2024",
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 print:hidden cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Formação</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {resume.education.map((edu, idx) => (
                      <div key={idx}>
                        {isEditMode ? (
                          <div className="flex flex-wrap items-center gap-2 mb-1 print:hidden">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.education[idx].degree = e.target.value;
                                onResumeChange(next);
                              }}
                              className="font-semibold text-zinc-900 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 flex-1"
                            />
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.education[idx].institution =
                                  e.target.value;
                                onResumeChange(next);
                              }}
                              className="text-zinc-700 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 flex-1"
                            />
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.education[idx].year = e.target.value;
                                onResumeChange(next);
                              }}
                              className="text-zinc-600 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 w-28"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = structuredClone(resume);
                                next.education.splice(idx, 1);
                                onResumeChange(next);
                              }}
                              className="p-1 text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null}

                        <div
                          className={`flex flex-col sm:flex-row sm:justify-between ${
                            isEditMode ? "hidden print:flex" : "flex"
                          }`}
                        >
                          <div>
                            <strong className="text-zinc-900">
                              {edu.degree}
                            </strong>{" "}
                            —{" "}
                            <span className="text-zinc-700">
                              {edu.institution}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 font-medium shrink-0">
                            {edu.year}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (sectionKey === "certifications") {
              const certs = resume.certifications || [];
              if (!isEditMode && certs.length === 0) return null;
              return (
                <section key="certifications" className="print-avoid-break">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-2">
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                      Certificações
                    </h2>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          onResumeChange({
                            ...resume,
                            certifications: [
                              ...certs,
                              {
                                name: "Nome da Certificação",
                                issuer: "Emissor (ex: AWS, Google, Linux Foundation)",
                                year: "2024",
                                url: "",
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 print:hidden cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Certificação</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {certs.map((cert, idx) => (
                      <div key={idx}>
                        {isEditMode ? (
                          <div className="flex flex-wrap items-center gap-2 mb-1 print:hidden">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.certifications[idx].name = e.target.value;
                                onResumeChange(next);
                              }}
                              placeholder="Certificação"
                              className="font-semibold text-zinc-900 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 flex-1"
                            />
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.certifications[idx].issuer =
                                  e.target.value;
                                onResumeChange(next);
                              }}
                              placeholder="Emissor"
                              className="text-zinc-700 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 flex-1"
                            />
                            <input
                              type="text"
                              value={cert.year || ""}
                              onChange={(e) => {
                                const next = structuredClone(resume);
                                next.certifications[idx].year = e.target.value;
                                onResumeChange(next);
                              }}
                              placeholder="Ano"
                              className="text-zinc-600 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 w-24"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = structuredClone(resume);
                                next.certifications.splice(idx, 1);
                                onResumeChange(next);
                              }}
                              className="p-1 text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null}

                        <div
                          className={`flex justify-between ${
                            isEditMode ? "hidden print:flex" : "flex"
                          }`}
                        >
                          <div>
                            <strong className="text-zinc-900">
                              {cert.name}
                            </strong>{" "}
                            —{" "}
                            <span className="text-zinc-700">{cert.issuer}</span>
                          </div>
                          {cert.year && (
                            <span className="text-xs text-zinc-500 font-medium">
                              {cert.year}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (sectionKey === "languages") {
              const langs = resume.languages || [];
              if (!isEditMode && langs.length === 0) return null;
              return (
                <section key="languages" className="print-avoid-break">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-1 mb-2">
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-950">
                      Idiomas
                    </h2>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          onResumeChange({
                            ...resume,
                            languages: [
                              ...langs,
                              {
                                language: "Inglês",
                                proficiency: "Avançado / Fluente",
                              },
                            ],
                          })
                        }
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 print:hidden cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar Idioma</span>
                      </button>
                    )}
                  </div>

                  {isEditMode ? (
                    <div className="space-y-1.5 print:hidden">
                      {langs.map((l, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={l.language}
                            onChange={(e) => {
                              const next = structuredClone(resume);
                              next.languages[idx].language = e.target.value;
                              onResumeChange(next);
                            }}
                            placeholder="Idioma"
                            className="font-semibold text-zinc-900 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 w-40"
                          />
                          <input
                            type="text"
                            value={l.proficiency}
                            onChange={(e) => {
                              const next = structuredClone(resume);
                              next.languages[idx].proficiency = e.target.value;
                              onResumeChange(next);
                            }}
                            placeholder="Nível (ex: Fluente C1)"
                            className="text-zinc-700 px-2 py-1 rounded border border-zinc-300 bg-zinc-50 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = structuredClone(resume);
                              next.languages.splice(idx, 1);
                              onResumeChange(next);
                            }}
                            className="p-1 text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className={`flex flex-wrap gap-x-6 gap-y-1 ${
                      isEditMode ? "hidden print:flex" : "flex"
                    }`}
                  >
                    {langs.map((l, idx) => (
                      <div key={idx}>
                        <strong className="text-zinc-900">{l.language}:</strong>{" "}
                        <span className="text-zinc-700">{l.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Modal Modo Preenchimento Rápido Gupy / Workday */}
      {showGupyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>Modo Colagem Rápida — Gupy, Workday & Lever</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Copie cada bloco isolado em texto puro para preencher formulários cadastrais em segundos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGupyModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {gupyBlocks.map((block) => (
                <div
                  key={block.id}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        {block.label}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {block.helper}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(block.content);
                        triggerCopied(block.id);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      {copiedType === block.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Bloco</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-950/80 p-2.5 rounded-lg border border-white/5">
                    {block.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
