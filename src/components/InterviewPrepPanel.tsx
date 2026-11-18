"use client";

import React, { useState } from "react";
import { InterviewPrep } from "@/types/resume";
import {
  MessageSquareCode,
  ShieldQuestion,
  Send,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

interface InterviewPrepPanelProps {
  interviewPrep?: InterviewPrep;
  roleTitle?: string;
}

export function InterviewPrepPanel({
  interviewPrep,
  roleTitle,
}: InterviewPrepPanelProps) {
  const [outreachText, setOutreachText] = useState(
    interviewPrep?.linkedinOutreachMessage || ""
  );
  const [copied, setCopied] = useState(false);

  if (!interviewPrep) {
    return (
      <div className="p-12 text-center bg-zinc-900/60 rounded-2xl border border-white/10">
        <p className="text-xs text-zinc-400">
          Roteiro de entrevista técnica disponível após a calibração da vaga.
        </p>
      </div>
    );
  }

  const handleCopyOutreach = () => {
    navigator.clipboard.writeText(
      outreachText || interviewPrep.linkedinOutreachMessage
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Mensagem de Abordagem para Recrutador / Tech Lead no LinkedIn */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Pitch de Abordagem Direta (LinkedIn / InMail / Email)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyOutreach}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Mensagem Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Mensagem</span>
              </>
            )}
          </button>
        </div>

        <textarea
          value={outreachText || interviewPrep.linkedinOutreachMessage}
          onChange={(e) => setOutreachText(e.target.value)}
          rows={4}
          className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-zinc-200 leading-relaxed focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Perguntas Prováveis na Entrevista Técnica */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06]">
          <MessageSquareCode className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white">
            Simulador de Perguntas Técnicas ({roleTitle || "Vaga Alvo"})
          </h3>
        </div>

        <div className="space-y-4">
          {interviewPrep.technicalQuestions.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-black/40 border border-white/[0.07] space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300">
                  Foco: {q.focusSkill}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Pergunta #{idx + 1}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                &ldquo;{q.question}&rdquo;
              </p>
              <div className="p-3 rounded-lg bg-blue-500/[0.06] border border-blue-500/20 text-xs text-zinc-300 flex items-start space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-200">
                    Como estruturar sua resposta:{" "}
                  </strong>
                  <span>{q.suggestedApproach}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mitigação de Gaps */}
      {interviewPrep.gapMitigationTips.length > 0 && (
        <div className="bg-zinc-900/80 border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.06]">
            <ShieldQuestion className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Como Defender Gaps de Stack na Entrevista
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-zinc-300">
            {interviewPrep.gapMitigationTips.map((tip, idx) => (
              <li key={idx} className="flex items-start space-x-2.5">
                <span className="text-amber-400 font-bold">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

