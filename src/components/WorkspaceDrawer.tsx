"use client";

import React, { useRef, useState } from "react";
import {
  ApplicationRecord,
  ApplicationStatus,
  MasterProfile,
} from "@/types/workspace";
import {
  X,
  History,
  BookmarkCheck,
  Trash2,
  Download,
  Upload,
  ExternalLink,
  FolderOpen,
} from "lucide-react";

const STATUS_LABELS: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  draft: {
    label: "Rascunho",
    color: "bg-zinc-800 text-zinc-300 border-white/10",
  },
  applied: {
    label: "Aplicado",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  interview: {
    label: "Entrevista",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  offer: {
    label: "Proposta",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  rejected: {
    label: "Encerrado",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
};

interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  masterProfile: MasterProfile | null;
  applications: ApplicationRecord[];
  activeApplicationId: string | null;
  onSelectApplication: (record: ApplicationRecord) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDeleteApplication: (id: string) => void;
  onClearMasterProfile: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonText: string) => void;
}

export function WorkspaceDrawer({
  isOpen,
  onClose,
  masterProfile,
  applications,
  activeApplicationId,
  onSelectApplication,
  onStatusChange,
  onDeleteApplication,
  onClearMasterProfile,
  onExportBackup,
  onImportBackup,
}: WorkspaceDrawerProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError(null);
      const text = await file.text();
      onImportBackup(text);
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Falha ao importar arquivo de backup."
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end print:hidden">
      <div className="bg-zinc-950 border-l border-white/10 w-full max-w-lg h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              Workspace Local-First & Histórico
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Master Profile Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Master Profile (Currículo Base)
                </span>
              </div>
              {masterProfile && (
                <button
                  type="button"
                  onClick={onClearMasterProfile}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>

            {masterProfile ? (
              <div className="text-xs text-zinc-300 space-y-1">
                <p>
                  <strong className="text-white">Origem:</strong>{" "}
                  {masterProfile.fileName || "Texto Base"} (
                  {masterProfile.rawText.length} caracteres)
                </p>
                <p className="text-[11px] text-zinc-500">
                  Atualizado em:{" "}
                  {new Date(masterProfile.updatedAt).toLocaleString("pt-BR")}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nenhum Master Profile salvo ainda. Digite ou envie seu currículo completo e clique em{" "}
                <strong className="text-zinc-200">&ldquo;Salvar Master&rdquo;</strong>{" "}
                para reutilizá-lo em 1 clique para várias vagas.
              </p>
            )}
          </div>

          {/* Lista de Candidaturas Salvas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Histórico de Vagas Calibradas ({applications.length})
              </h3>
            </div>

            {applications.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-900/50 border border-dashed border-white/10 text-center space-y-2">
                <FolderOpen className="w-6 h-6 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">
                  Suas análises e currículos customizados aparecerão salvos aqui automaticamente no seu navegador.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {applications.map((app) => {
                  const isActive = app.id === activeApplicationId;
                  return (
                    <div
                      key={app.id}
                      className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                        isActive
                          ? "bg-blue-950/30 border-blue-500/40"
                          : "bg-zinc-900/80 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-white">
                            {app.jobTitle}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {app.companyName} •{" "}
                            {new Date(app.updatedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold">
                            {app.result.atsScore}%
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteApplication(app.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                            title="Excluir do histórico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            onStatusChange(
                              app.id,
                              e.target.value as ApplicationStatus
                            )
                          }
                          className={`text-[11px] font-medium px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            STATUS_LABELS[app.status].color
                          }`}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option
                              key={k}
                              value={k}
                              className="bg-zinc-900 text-zinc-200"
                            >
                              Status: {v.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectApplication(app);
                            onClose();
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-zinc-200 cursor-pointer"
                        >
                          <span>Abrir Sessão</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Backup & Restore JSON */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/60 space-y-2">
          {importError && (
            <p className="text-xs text-rose-400">{importError}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar Backup (.JSON)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
              id="backup-import"
            />
            <label
              htmlFor="backup-import"
              className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restaurar Backup</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

