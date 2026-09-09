"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore, useMemo, useCallback } from "react";
import { Tool } from "@/types/tool";
import { InteractiveForm } from "./InteractiveForm";
import { PromptOutputPanel } from "./PromptOutputPanel";
import { SequentialNavigation } from "./SequentialNavigation";
import { validateForm } from "@/lib/validation";
import { assemblePrompt } from "@/lib/promptAssembler";
import {
  subscribeToToolData,
  getToolDataSnapshot,
  saveToolData,
  clearToolData,
} from "@/lib/storage";

interface ToolGeneratorContainerProps {
  tool: Tool;
}

export const ToolGeneratorContainer: React.FC<ToolGeneratorContainerProps> = ({
  tool,
}) => {
  // Subscribe to localStorage snapshot reactively and safely across SSR & Client
  const storedRaw = useSyncExternalStore(
    subscribeToToolData,
    () => getToolDataSnapshot(tool.slug),
    () => "{}"
  );

  const storedValues = useMemo(() => {
    try {
      const parsed = JSON.parse(storedRaw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // Gracefully handle parsing errors
    }
    return {};
  }, [storedRaw]);

  const formValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of tool.fields) {
      if (field.defaultValue) {
        values[field.id] = field.defaultValue;
      }
      if (typeof storedValues[field.id] === "string" && storedValues[field.id].trim().length > 0) {
        values[field.id] = storedValues[field.id];
      }
    }
    return values;
  }, [tool.fields, storedValues]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  // Auto-scroll to output panel on mobile (< 1024px) after prompt generation
  const outputPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (generatedPrompt && window.innerWidth < 1024) {
      outputPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generatedPrompt]);

  // Field change handler with auto-save to localStorage
  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      const next = { ...formValues, [fieldId]: value };
      saveToolData(tool.slug, next);

      // Clear field error on change
      setErrors((prev) => {
        if (prev[fieldId]) {
          const nextErrors = { ...prev };
          delete nextErrors[fieldId];
          return nextErrors;
        }
        return prev;
      });
    },
    [tool.slug, formValues]
  );

  // Batch fields change handler with atomic save to localStorage
  const handleBatchFieldChange = useCallback(
    (updates: Record<string, string>) => {
      const next = { ...formValues, ...updates };
      saveToolData(tool.slug, next);

      // Clear errors on updated fields
      setErrors((prev) => {
        const nextErrors = { ...prev };
        Object.keys(updates).forEach((k) => delete nextErrors[k]);
        return nextErrors;
      });
    },
    [tool.slug, formValues]
  );

  // Form submit handler with validation and prompt assembly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(tool.fields, formValues);
    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.firstErrorFieldId) {
        const el = document.getElementById(validation.firstErrorFieldId);
        if (el) {
          el.focus();
        }
      }
      return;
    }

    setErrors({});
    const promptText = assemblePrompt(tool, formValues);
    setGeneratedPrompt(promptText);
  };

  // Reset handler for the active tool
  const handleReset = useCallback(() => {
    clearToolData(tool.slug);
    setErrors({});
    setGeneratedPrompt(null);
  }, [tool.slug]);

  return (
    <div className="space-y-6">
      {/* Top 2-Panel Generator */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left Panel: Active Interactive Form */}
        <div className="lg:col-span-6">
          <InteractiveForm
            tool={tool}
            formValues={formValues}
            errors={errors}
            onFieldChange={handleFieldChange}
            onBatchFieldChange={handleBatchFieldChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
        </div>

        {/* Right Panel: Active Prompt Output */}
        <div ref={outputPanelRef} id="tool-output-panel" className="lg:col-span-6">
          <PromptOutputPanel
            prompt={generatedPrompt}
            platform={tool.targetPlatform}
            tool={tool}
            formValues={formValues}
          />
        </div>
      </div>

      {/* Bottom Sequential Workflow Navigation */}
      <SequentialNavigation
        previousStep={tool.previousStep}
        nextStep={tool.nextStep}
        isPromptGenerated={!!generatedPrompt}
      />
    </div>
  );
};
