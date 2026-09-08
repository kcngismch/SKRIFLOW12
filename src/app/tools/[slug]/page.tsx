import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ACTIVE_TOOLS, getToolBySlug } from "@/data/tools";
import { ToolDetailShell } from "@/components/ToolDetailShell";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = ACTIVE_TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
  slugs.push({ slug: "cari-validasi-fenomena" });
  return slugs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Tidak Ditemukan — SKRIFLOW",
    };
  }

  return {
    title: `${tool.name} — SKRIFLOW Prompt Tools`,
    description: tool.description,
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolDetailShell tool={tool} />;
}
