import React from "react";
import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { BridgeToSolution } from "@/components/landing/BridgeToSolution";
import { CompatibilityStrip } from "@/components/landing/CompatibilityStrip";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { CurrentToolsSection } from "@/components/landing/CurrentToolsSection";
import { BetaSection } from "@/components/landing/BetaSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "SKRIFLOW Prompt Tools — Mulai Skripsi Tanpa Bingung Nulis Prompt",
  description:
    "Generator prompt untuk membantu mahasiswa mencari ide skripsi, menemukan fenomena empiris, memetakan literatur di NotebookLM, dan membedah hasil bersama ChatGPT atau Gemini.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080D1D] text-[#FFF9EE]">
      {/* Sticky Header Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <LandingHero />

        {/* 2. Problem Awareness (#masalah) */}
        <ProblemSection />

        {/* 3. Bridge to Solution */}
        <BridgeToSolution />

        {/* 4. Compatibility Strip */}
        <CompatibilityStrip />

        {/* 5. Feature Grid (#fitur) */}
        <FeatureGrid />

        {/* 6. How It Works (#cara-kerja) */}
        <HowItWorks />

        {/* 7. Product Demo Preview (#preview) */}
        <ProductDemo />

        {/* 8. 3 Active Tools Section */}
        <CurrentToolsSection />

        {/* 9. Beta Prototype Section (Testimonial Placeholder) */}
        <BetaSection />

        {/* 10. Pricing & Offer Section (#harga) */}
        <PricingSection />

        {/* 11. FAQ Accordion (#faq) */}
        <FAQSection />

        {/* 12. Final Call-to-Action */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
