"use client";
import React from "react";

export function SectionMarker({ children }: { children: React.ReactNode }) {
  return <div className="section-kicker flex items-center gap-2 text-[var(--accent)] font-mono text-[10px] tracking-widest"><span className="w-8 h-px bg-[var(--accent)]"></span>{children}</div>;
}

export function PageIntro({ index, eyebrow, title, body }: { index: string; eyebrow: string; title: React.ReactNode; body: string }) {
  return (
    <section className="page-intro max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row gap-12 md:gap-24 items-start">
      <div className="flex-1 flex flex-col gap-6">
        <div className="eyebrow font-mono text-[10px] text-[var(--accent)] tracking-widest flex items-center gap-3">
          <span className="w-8 h-px bg-[var(--accent)]"></span>
          {eyebrow}
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-[var(--text-primary)] leading-tight tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex-1 md:mt-12 flex flex-col gap-8 border-t border-[var(--border)] pt-8">
        <div className="flex justify-between items-baseline font-mono text-xs text-[var(--text-muted)] tracking-widest">
          <span>PAGE INDEX / {index}</span>
          <span>OVERVIEW</span>
        </div>
        <p className="font-sans text-[var(--text-secondary)] text-lg leading-relaxed max-w-md">
          {body}
        </p>
      </div>
    </section>
  );
}
