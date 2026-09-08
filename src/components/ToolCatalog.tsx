"use client";

import React, { useState, useMemo } from "react";
import { Tool } from "@/types/tool";
import { ToolSearch } from "./ToolSearch";
import { ToolCard } from "./ToolCard";
import { SearchX, RotateCcw } from "lucide-react";

interface ToolCatalogProps {
  tools: Tool[];
}

export const ToolCatalog: React.FC<ToolCatalogProps> = ({ tools }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tools;

    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.targetPlatform.toLowerCase().includes(query)
    );
  }, [tools, searchQuery]);

  return (
    <div className="space-y-6">
      <ToolSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalResults={filteredTools.length}
        totalTools={tools.length}
      />

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#273352] bg-[#11182D]/50 py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#11182D] border border-[#273352] text-[#FF6F61]">
            <SearchX className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-[#FFF9EE]">
            Tidak ada tool yang cocok
          </h3>
          <p className="mt-1 text-xs text-[#AAB4D0] max-w-sm">
            Tidak ditemukan tool dengan kata kunci &ldquo;{searchQuery}&rdquo;. Coba cari dengan kata kunci lain seperti nama atau platform tujuan.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#273352] bg-[#11182D] px-3.5 py-1.5 text-xs font-semibold text-[#70E1B6] hover:bg-[#16213D] hover:border-[#70E1B6]/40 focus-visible:ring-2 focus-visible:ring-[#2959FF] focus-visible:outline-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Pencarian
          </button>
        </div>
      )}
    </div>
  );
};
