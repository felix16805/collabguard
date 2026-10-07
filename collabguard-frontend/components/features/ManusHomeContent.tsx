"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { GraphBoard } from "./GraphBoard";
import { type MethodKey, methodContent } from "@/lib/mock-data";
import { ArrowRight, ArrowUpRight, Terminal, Network } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SectionMarker({ children }: { children: React.ReactNode }) {
  return <div className="section-kicker flex items-center gap-2 text-[var(--accent)] font-mono text-[10px] tracking-widest"><span className="w-8 h-px bg-[var(--accent)]"></span>{children}</div>;
}

export function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  
  const steps = useMemo(() => [
    { number: "01", eyebrow: "START WITH A PAIR", title: "Similarity is only the first signal.", body: "A pairwise checker sees two submissions and a score. CollabGuard starts there, then asks what else is connected." },
    { number: "02", eyebrow: "FIND THE BRIDGE", title: "The middle node changes the question.", body: "A submission that sits between two pockets can be the missing context. The graph keeps that bridge visible." },
    { number: "03", eyebrow: "SURFACE THE CLUSTER", title: "The pattern emerges at network scale.", body: "Connected nodes become a case file: cluster confidence, repeated pairs, and a path a faculty member can review." },
  ], []);

  useEffect(() => {
    const onScroll = () => {
      const element = sectionRef.current;
      if (!element) return;
      const distance = window.innerHeight * 0.72;
      const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.45 - element.getBoundingClientRect().top) / Math.max(1, element.offsetHeight - distance)));
      setStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [steps.length]);

  return (
    <section className="story-section section-frame max-w-6xl mx-auto px-6 py-24" ref={sectionRef}>
      <div className="story-copy">
        <SectionMarker>02 — FOLLOW THE SIGNAL</SectionMarker>
        <h2 className="font-display text-[var(--text-primary)]">From a score<br />to a <span className="text-[var(--accent)]">story.</span></h2>
        <div className="story-steps mt-12">
          {steps.map((item, index) => (
            <div className={`story-step-copy ${step === index ? "is-active" : ""}`} key={item.number}>
              <span>{item.number}</span>
              <div>
                <b className="font-mono">{item.eyebrow}</b>
                <h3 className="font-display">{item.title}</h3>
                <p className="font-sans text-[var(--text-secondary)]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="story-sticky">
        <div className={`story-visual story-step-${step}`}>
          <div className="story-visual-head font-mono">
            <span>SCROLL-LINKED GRAPH / C-03</span>
            <span>{String(step + 1).padStart(2, "0")} / 03</span>
          </div>
          <GraphBoard compact onSelect={() => undefined} />
          <div className="story-caption font-mono">
            <span className="story-caption-mark" />
            {steps[step].eyebrow}
            <strong>{step === 0 ? "A ↔ B / 0.81" : step === 1 ? "SUB-042 / BRIDGE NODE" : "CLUSTER C-03 / 0.86"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ManusHomeContent() {
  const router = useRouter();
  const [activeMethod, setActiveMethod] = useState<MethodKey>("fingerprint");

  return (
    <div className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
      <section className="home-intro section-frame max-w-6xl mx-auto px-6 py-24 border-t border-[var(--border)]">
        <div>
          <SectionMarker>01 — THE SIGNAL</SectionMarker>
          <h2 className="font-display">Suspicion is a <span className="accent-underline text-[var(--accent)]">relationship</span> problem.</h2>
        </div>
        <div className="intro-copy font-sans text-[var(--text-secondary)]">
          <p>Academic plagiarism rarely travels in a straight line. A student can pass a solution through an intermediary, change the surface syntax, and stay below a pairwise threshold.</p>
          <p>CollabGuard makes the indirect visible: the bridge submission, the repeated pair, the path that connects them over an entire semester.</p>
          <button className="inline-arrow text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center gap-2 mt-6 font-mono text-xs uppercase tracking-widest transition-colors" onClick={() => router.push("/architecture")}>
            Explore the system map <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <ScrollStory />

      <section className="home-method section-frame max-w-6xl mx-auto px-6 py-24 border-t border-[var(--border)]">
        <div className="method-intro">
          <SectionMarker>02 — THE METHOD</SectionMarker>
          <h2 className="font-display">Polyglot by design.<br /><span className="text-[var(--text-secondary)]">Specific by default.</span></h2>
          <p className="font-sans text-[var(--text-secondary)] mt-4 max-w-lg">MongoDB stores the flexible raw material. Neo4j stores the relationships that make the material legible.</p>
        </div>
        
        <div className="method-content mt-12 flex flex-col md:flex-row gap-12">
          <div className="method-tabs flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 w-full md:w-48 shrink-0">
            {(Object.keys(methodContent) as MethodKey[]).map((key, index) => (
              <button 
                key={key} 
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] font-mono text-xs text-left transition-colors whitespace-nowrap md:whitespace-normal ${activeMethod === key ? "bg-[var(--surface-2)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"}`} 
                onClick={() => setActiveMethod(key)}
              >
                <span className={activeMethod === key ? "text-[var(--accent)]" : ""}>0{index + 1}</span>
                {methodContent[key].label.split(" / ")[1]}
              </button>
            ))}
          </div>
          
          <div className="method-panel flex-1 bg-[var(--surface-1)] rounded-[var(--radius-md)] border border-[var(--border)] p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="method-panel-copy flex-1">
              <span className="overline font-mono text-xs tracking-widest text-[var(--text-muted)]">{methodContent[activeMethod].label}</span>
              <h3 className="font-display text-xl mt-2 mb-4">{methodContent[activeMethod].title}</h3>
              <p className="font-sans text-[var(--text-secondary)] text-sm mb-6">{methodContent[activeMethod].body}</p>
              <div className="method-code flex items-center gap-3 bg-[var(--bg)] border border-[var(--border)] px-4 py-3 rounded-[var(--radius-sm)] font-mono text-xs text-[var(--accent-text)]">
                <Terminal size={16} className="shrink-0" />
                <code>{methodContent[activeMethod].code}</code>
              </div>
            </div>
            <div className="method-visual hidden md:flex relative w-48 h-48 shrink-0 bg-[var(--bg)] rounded-full items-center justify-center border border-[var(--border)]">
              <div className="visual-core flex flex-col items-center gap-2 text-[var(--accent)] font-mono text-[10px]">
                <Network size={28} />
                <span>GRAPH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-next section-frame max-w-6xl mx-auto px-6 py-24 border-t border-[var(--border)] flex flex-col md:flex-row justify-between gap-12 items-end">
        <div>
          <SectionMarker>03 — CONTINUE</SectionMarker>
          <h2 className="font-display mt-4">Start with the <span className="text-[var(--accent)]">map.</span><br />Stay for the evidence.</h2>
        </div>
        <div className="next-links flex flex-col gap-3 w-full md:w-auto">
          <Link href="/about" className="flex items-center justify-between gap-12 px-6 py-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] transition-colors font-mono text-sm tracking-wide">
            <span>About the project</span>
            <ArrowUpRight size={16} className="text-[var(--text-muted)]" />
          </Link>
          <Link href="/components" className="flex items-center justify-between gap-12 px-6 py-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] transition-colors font-mono text-sm tracking-wide">
            <span>Components library</span>
            <ArrowUpRight size={16} className="text-[var(--text-muted)]" />
          </Link>
          <Link href="/resources" className="flex items-center justify-between gap-12 px-6 py-4 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-sm)] transition-colors font-mono text-sm tracking-wide">
            <span>Resources & references</span>
            <ArrowUpRight size={16} className="text-[var(--text-muted)]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
