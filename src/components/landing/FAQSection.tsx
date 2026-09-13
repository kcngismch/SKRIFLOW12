"use client";

import React, { useState } from "react";
import { FAQ_ITEMS } from "@/data/faq";
import { ChevronDown, HelpCircle } from "lucide-react";

export const FAQSection: React.FC = () => {
  // Store open state by FAQ id
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="relative border-b border-[#2E2748] py-16 sm:py-24 bg-[#0C0A1A]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6D5AE6]/30 bg-[#6D5AE6]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFB84D]">
            <HelpCircle className="h-3.5 w-3.5 text-[#FFB84D]" aria-hidden="true" />
            <span>PERTANYAAN UMUM</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#FBFAFF] sm:text-3xl lg:text-4xl leading-tight">
            Frequently Asked Questions
          </h2>

          <p className="mt-3 text-sm text-[#A79FC4]">
            Klarifikasi penting mengenai batasan sistem, cara penggunaan, dan status pengembangan SKRIFLOW.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            const contentId = `faq-content-${item.id}`;
            const headerId = `faq-header-${item.id}`;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[#2E2748] bg-[#191430] transition-colors"
              >
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleFAQ(item.id)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-[#FBFAFF] transition-colors hover:text-[#FFB84D] focus-visible:ring-2 focus-visible:ring-[#6D5AE6] focus-visible:outline-none"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#A79FC4] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#FFB84D]" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-[#2E2748]/70 px-5 pb-5 pt-3.5 text-xs sm:text-sm leading-relaxed text-[#A79FC4]"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
