import React from "react";
import { Copy, ExternalLink, Terminal } from "lucide-react";
import { PlatformTarget } from "@/types/tool";

interface EmptyPromptStateProps {
  platform: PlatformTarget;
}

export const EmptyPromptState: React.FC<EmptyPromptStateProps> = ({ platform }) => {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#2E2748] bg-[#191430] p-5 sm:p-6">
      <div>
        <div className="flex items-center justify-between border-b border-[#2E2748] pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#FFB84D]" />
            <h2 className="text-base font-bold text-[#FBFAFF]">Hasil Prompt</h2>
          </div>
          <span className="text-xs font-medium text-[#A79FC4]">Output Area</span>
        </div>

        {/* Monospace output display area */}
        <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-[#2E2748] bg-[#0C0A1A]/70 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#191430] border border-[#2E2748] text-[#A79FC4]">
            <Terminal className="h-5 w-5 text-[#6D5AE6]" />
          </div>
          <p className="mt-3 text-sm font-medium text-[#FBFAFF]">
            Prompt yang sudah dirakit akan muncul di sini.
          </p>
          <p className="mt-1 text-xs text-[#A79FC4] max-w-xs font-sans">
            Isi parameter di panel kiri setelah generator aktif untuk merakit prompt terstruktur siap pakai.
          </p>
        </div>
      </div>

      {/* Action buttons footer */}
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end border-t border-[#2E2748]/70 pt-4">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-4 py-2.5 text-xs font-semibold text-[#A79FC4]/50 cursor-not-allowed opacity-60"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy Prompt</span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2748] bg-[#0C0A1A] px-4 py-2.5 text-xs font-semibold text-[#A79FC4]/50 cursor-not-allowed opacity-60"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Buka {platform}</span>
        </button>
      </div>
    </div>
  );
};
