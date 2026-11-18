"use client";

import React, { useState } from "react";
import { ImprovementItem } from "@/types/resume";
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  GitCommit,
  RotateCcw,
  Edit3,
  Check,
  X,
} from "lucide-react";

interface DiffViewerProps {
  improvements: ImprovementItem[];
  onDecisionChange: (
    improvement: ImprovementItem,
    decision: "accepted" | "rejected",
    customSnippet?: string
  ) => void;
  onBulkDecision: (decision: "accepted" | "rejected") => void;
}

export function DiffViewer({
  improvements,
  onDecisionChange,
  onBulkDecision,
}: DiffViewerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>("");

  if (!improvements || improvements.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-900/60 rounded-2xl border border-white/10">
        <p className="text-xs text-zinc-400">
          Nenhuma alteração pontual registrada para exibição.
        </p>
      </div>
    );
  }

  const acceptedCount = improvements.filter(
    (i) => i.status !== "rejected"
  ).length;

  const startEditing = (item: ImprovementItem) => {
    setEditingId(item.id);
    setDraftText(item.improvedSnippet);
  };

  const saveEdit = (item: ImprovementItem) => {
    if (!draftText.trim()) return;
    onDecisionChange(item, "accepted", draftText.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controle Estilo Code Review */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-xs text-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">
              Code Review do Currículo ({acceptedCount}/{improvements.length}{" "}
              ativas):
            </span>{" "}
            <span>
              Aprove, edite ou reverta cada sugestão individualmente. O Currículo A4 e o Score ATS ao vivo refletem sua decisão na hora.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onBulkDecision("accepted")}
            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 font-semibold transition cursor-pointer"
          >
            Manter Todas Otimizadas
          </button>
          <button
            type="button"
            onClick={() => onBulkDecision("rejected")}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 transition cursor-pointer"
          >
            Reverter Todas
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {improvements.map((item, index) => {
          const isRejected = item.status === "rejected";
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id || index}
              className={`bg-zinc-900/80 border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl space-y-3.5 sm:space-y-4 transition ${
                isRejected
                  ? "border-white/[0.05] opacity-75"
                  : "border-white/10"
              }`}
            >
              {/* Header da Alteração + Botões de Decisão */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <GitCommit className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {item.section}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isRejected
                        ? "bg-zinc-800 text-zinc-400"
                        : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {isRejected ? "Revertida ao Original" : "Aplicada no CV"}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] text-zinc-300 transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-sky-400" />
                      <span>Editar</span>
                    </button>
                  )}

                  {isRejected ? (
                    <button
                      type="button"
                      onClick={() => onDecisionChange(item, "accepted")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-[11px] text-blue-200 font-semibold transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Aplicar Melhoria</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDecisionChange(item, "rejected")}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-[11px] text-rose-300 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reverter ao Original</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Split Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Original */}
                <div
                  className={`p-3.5 sm:p-4 rounded-xl border space-y-2 ${
                    isRejected
                      ? "bg-zinc-800/80 border-white/20"
                      : "bg-rose-500/[0.06] border-rose-500/20"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>
                      Original {isRejected ? "(Mantido no CV)" : "(Substituído)"}
                    </span>
                  </span>
                  <p
                    className={`text-xs leading-relaxed ${
                      isRejected
                        ? "text-zinc-200 font-medium"
                        : "text-zinc-400 line-through decoration-rose-500/40"
                    }`}
                  >
                    {item.originalSnippet}
                  </p>
                </div>

                {/* Otimizado ou Editor Inline */}
                <div
                  className={`p-3.5 sm:p-4 rounded-xl border space-y-2 ${
                    isRejected
                      ? "bg-zinc-900/50 border-white/5"
                      : "bg-blue-500/[0.08] border-blue-500/30"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Calibrado para ATS (Google XYZ)</span>
                  </span>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 rounded-lg bg-black/60 border border-blue-500/50 text-xs text-white focus:outline-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancelar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(item)}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-xs cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Salvar & Aplicar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`text-xs leading-relaxed font-medium ${
                        isRejected ? "text-zinc-500 line-through" : "text-zinc-100"
                      }`}
                    >
                      {item.improvedSnippet}
                    </p>
                  )}
                </div>
              </div>

              {/* Justificativa de RH / Triagem */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-zinc-300 flex items-start space-x-2.5">
                <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-400" />
                <div className="leading-relaxed">
                  <strong className="text-zinc-200">Impacto na Triagem: </strong>
                  <span className="text-zinc-400">{item.rationale}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
