"use client";

import React from "react";
import { OptimizationResult, ScoreBreakdown } from "@/types/resume";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  FileCheck,
  TrendingUp,
  Target,
  Briefcase,
  ArrowUpRight,
  Edit3,
} from "lucide-react";

interface ScoreDashboardProps {
  result: OptimizationResult;
  liveAtsScore: number;
  liveBreakdown: ScoreBreakdown;
  liveUnfilledPlaceholders: number;
  isDemo?: boolean;
  onJumpToEditor?: () => void;
}

export function ScoreDashboard({
  result,
  liveAtsScore,
  liveBreakdown,
  liveUnfilledPlaceholders,
  isDemo,
  onJumpToEditor,
}: ScoreDashboardProps) {
  const {
    originalAtsScore,
    jobAnalysis,
    matchedKeywords,
    missingKeywords,
    missingDesiredKeywords = [],
    keywordDetails = [],
    criticalAlerts,
    actionableTips,
  } = result;

  const beforeScore = originalAtsScore ?? Math.max(35, liveAtsScore - 26);
  const scoreDelta = liveAtsScore - beforeScore;

  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        text: "text-blue-400",
        stroke: "#60a5fa",
        label: "Alta Probabilidade de Triagem",
      };
    }
    if (score >= 60) {
      return {
        text: "text-amber-400",
        stroke: "#fbbf24",
        label: "Aderência Moderada (Ajustes Recomendados)",
      };
    }
    return {
      text: "text-rose-400",
      stroke: "#fb7185",
      label: "Baixa Aderência (Gaps Estruturais)",
    };
  };

  const theme = getScoreTheme(liveAtsScore);
  const strokeDashoffset = 283 - (283 * liveAtsScore) / 100;

  return (
    <div className="space-y-6">
      {/* Banner Modo Demo / Local */}
      {isDemo && (
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-300 flex items-start space-x-3 backdrop-blur-md">
          <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-white">
              Modo Simulação Híbrida Ativo:
            </span>{" "}
            <span>
              Exibindo diagnóstico com cálculo determinístico ao vivo. Qualquer edição no currículo recalcula o score instantaneamente.
            </span>
          </div>
        </div>
      )}

      {/* Alerta Interativo de Placeholders Pendentes */}
      {liveUnfilledPlaceholders > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-100">
                {liveUnfilledPlaceholders}{" "}
                {liveUnfilledPlaceholders === 1
                  ? "placeholder de métrica pendente"
                  : "placeholders de métrica pendentes"}{" "}
                no currículo:
              </span>{" "}
              <span>
                Substitua trechos como{" "}
                <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono">
                  [ex: redução de X%]
                </code>{" "}
                pelos seus números reais para elevar seu pilar de Impacto Quantificável.
              </span>
            </div>
          </div>
          {onJumpToEditor && (
            <button
              type="button"
              onClick={onJumpToEditor}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-100 font-semibold whitespace-nowrap transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Preencher no Editor</span>
            </button>
          )}
        </div>
      )}

      {/* Grid Superior: Score Antes -> Depois (Ao Vivo) + 4 Pilares */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Card do Score Geral + Delta Antes/Depois */}
        <div className="lg:col-span-4 bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-xl relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Score ATS (Ao Vivo)</span>
          </div>

          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center my-1">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-zinc-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={theme.stroke}
                strokeWidth="7"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme.text}`}
              >
                {liveAtsScore}
                <span className="text-lg sm:text-xl font-medium text-zinc-400">
                  %
                </span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">
                ATS Index
              </span>
            </div>
          </div>

          {/* Comparativo Antes vs Depois */}
          <div className="mt-2 flex items-center justify-center space-x-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
              Original: {beforeScore}%
            </span>
            <span className="text-zinc-500">→</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold ${
                scoreDelta >= 0
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              }`}
            >
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts
            </span>
          </div>

          <div className="mt-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300">
            {theme.label}
          </div>
        </div>

        {/* 4 Pilares Detalhados V2 */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-200">
                1. Hard Skills & Stack
              </span>
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-white">
                    {liveBreakdown.hardSkillsScore}
                  </span>
                  <span className="text-xs text-zinc-400">%</span>
                </div>
                {result.originalScoreBreakdown && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    Antes: {result.originalScoreBreakdown.hardSkillsScore}%
                  </span>
                )}
              </div>
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${liveBreakdown.hardSkillsScore}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Presença literal e semântica das tecnologias obrigatórias e diferenciais.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-200">
                2. Senioridade & Escopo
              </span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-white">
                    {liveBreakdown.experienceAlignmentScore}
                  </span>
                  <span className="text-xs text-zinc-400">%</span>
                </div>
                {result.originalScoreBreakdown && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    Antes:{" "}
                    {result.originalScoreBreakdown.experienceAlignmentScore}%
                  </span>
                )}
              </div>
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${liveBreakdown.experienceAlignmentScore}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Alinhamento com as responsabilidades da vaga e verbos fortes de liderança/execução.
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-200">
                3. Impacto Quantificável (XYZ)
              </span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-white">
                    {liveBreakdown.impactMetricsScore ?? 75}
                  </span>
                  <span className="text-xs text-zinc-400">%</span>
                </div>
                {result.originalScoreBreakdown && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    Antes:{" "}
                    {result.originalScoreBreakdown.impactMetricsScore ?? 45}%
                  </span>
                )}
              </div>
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${liveBreakdown.impactMetricsScore ?? 75}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Proporção de realizações ancoradas em métricas reais (%, latência, receita, escala).
            </p>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-200">
                4. Legibilidade & Estrutura ATS
              </span>
              <FileCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-white">
                    {liveBreakdown.atsClarityScore}
                  </span>
                  <span className="text-xs text-zinc-400">%</span>
                </div>
                {result.originalScoreBreakdown && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    Antes: {result.originalScoreBreakdown.atsClarityScore}%
                  </span>
                )}
              </div>
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${liveBreakdown.atsClarityScore}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Estrutura limpa para parsers OCR, ausência de keyword stuffing e dados de contato.
            </p>
          </div>
        </div>
      </div>

      {/* Card de Análise Estruturada da Vaga (JobAnalysis) */}
      {jobAnalysis && (
        <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Raio-X Estruturado da Vaga: {jobAnalysis.roleTitle}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium">
                Senioridade: {jobAnalysis.seniority}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Principais Responsabilidades
              </p>
              <ul className="space-y-1.5 text-zinc-300">
                {jobAnalysis.responsibilities.map((r, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Diferenciais Desejáveis (Nice-to-have)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {jobAnalysis.desiredSkills.map((sk, idx) => {
                  const isMissing = missingDesiredKeywords.includes(sk);
                  return (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                        isMissing
                          ? "bg-zinc-800/70 border-white/10 text-zinc-400"
                          : "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      }`}
                    >
                      {sk} {isMissing ? "(Ausente)" : "✓"}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Cultura & Soft Skills Mapeadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {jobAnalysis.cultureKeywords.map((ck, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] border border-white/10 text-zinc-300"
                  >
                    {ck}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Palavras-chave: Identificadas (Exato vs Sinônimo) vs Gaps Obrigatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Keywords Presentes no Currículo
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              {matchedKeywords.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
            {matchedKeywords.map((kw, i) => {
              const detail = keywordDetails.find(
                (d) => d.keyword.toLowerCase() === kw.toLowerCase()
              );
              const isSynonym = detail?.matchType === "synonym";
              return (
                <span
                  key={i}
                  title={
                    isSynonym
                      ? `Detectado via sinônimo "${detail?.matchedTerm}"`
                      : `Match exato (${detail?.foundIn?.join(", ") || "Currículo"})`
                  }
                  className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium border ${
                    isSynonym
                      ? "bg-sky-500/10 text-sky-200 border-sky-500/25"
                      : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSynonym ? "bg-sky-400" : "bg-blue-400"
                    }`}
                  />
                  <span>{kw}</span>
                  {isSynonym && (
                    <span className="text-[10px] text-sky-400/90 font-mono">
                      (~{detail?.matchedTerm})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Gaps Obrigatórios na Vaga
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              {missingKeywords.length}
            </span>
          </div>

          {missingKeywords.length === 0 ? (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Excelente! Todas as hard skills obrigatórias da vaga estão cobertas no currículo calibrado.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
              {missingKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alertas Críticos e Dicas Técnicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {criticalAlerts.length > 0 && (
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Pontos de Atenção na Triagem
              </h3>
            </div>
            <ul className="mt-4 space-y-3">
              {criticalAlerts.map((alert, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-300 flex items-start space-x-2.5 leading-relaxed"
                >
                  <span className="text-rose-400 font-bold mt-0.5 shrink-0">
                    •
                  </span>
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {actionableTips.length > 0 && (
          <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06] text-sky-400">
              <Lightbulb className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                Estratégia Rápida para Entrevista
              </h3>
            </div>
            <ul className="mt-4 space-y-3">
              {actionableTips.map((tip, i) => (
                <li
                  key={i}
                  className="text-xs text-zinc-300 flex items-start space-x-2.5 leading-relaxed"
                >
                  <span className="text-sky-400 font-bold mt-0.5 shrink-0">
                    •
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
