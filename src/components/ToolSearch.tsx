"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface ToolSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalResults: number;
  totalTools: number;
}

export const ToolSearch: React.FC<ToolSearchProps> = ({
  searchQuery,
  onSearchChange,
  totalResults,
  totalTools,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <label htmlFor="tool-search" className="sr-only">
          Cari tools berdasarkan nama, deskripsi, atau platform
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Search className="h-4 w-4 text-[#A79FC4]" />
        </div>
        <input
          id="tool-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari tool, topik, atau platform (misal: NotebookLM)..."
          className="w-full rounded-lg border border-[#2E2748] bg-[#191430] py-2.5 pl-10 pr-9 text-sm text-[#FBFAFF] placeholder-[#A79FC4]/60 transition-colors focus:border-[#6D5AE6] focus:bg-[#221A42] focus:outline-none focus:ring-1 focus:ring-[#6D5AE6]"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#A79FC4] hover:text-[#FBFAFF] focus:outline-none"
            aria-label="Bersihkan pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#A79FC4]">
        <span>
          Menampilkan <strong className="text-[#FBFAFF]">{totalResults}</strong>{" "}
          dari {totalTools} tool aktif
        </span>
      </div>
    </div>
  );
};
