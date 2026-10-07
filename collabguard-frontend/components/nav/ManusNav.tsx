"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Moon, X, Menu } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/": "Overview",
  "/about": "About",
  "/components": "Components",
  "/resources": "Resources",
  "/architecture": "Architecture",
};

export function LogoMark() {
  return <span className="logo-mark" aria-hidden="true"><span /><span /><span /></span>;
}

export function ManusNav() {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Basic theme logic
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const saved = localStorage.getItem("collabguard-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);
  
  const onToggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem("collabguard-theme", newTheme);
  };

  return (
    <motion.header className="site-header reactbits-nav" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>
      <Link href="/" className="brand" onClick={() => setMobileOpen(false)} aria-label="CollabGuard home">
        <LogoMark /><span>COLLABGUARD</span><small>NS25 / 01</small>
      </Link>
      
      <nav className={`main-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Primary navigation">
        {Object.keys(routeLabels).map((route) => (
          <Link key={route} href={route} onClick={() => setMobileOpen(false)} className={`nav-item ${path === route ? "is-active" : ""}`} style={{ position: "relative", display: "inline-block" }}>
            {path === route ? <motion.span className="nav-active-pill" layoutId="nav-active-pill" transition={{ type: "spring", stiffness: 420, damping: 30 }} /> : null}
            <span>{routeLabels[route]}</span>
          </Link>
        ))}
        <button className="mobile-theme-toggle" onClick={onToggleTheme}>{theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} Switch to {theme === "dark" ? "light" : "dark"} mode</button>
      </nav>
      
      <div className="header-meta">
        <span className="status-light" />
        <span>MODEL ONLINE</span>
        <span className="header-divider" />
        <span>VIT / BCSE406L</span>
        <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"}`}>
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === "dark" ? "LIGHT" : "DARK"}</span>
        </button>
      </div>
      
      <button className="menu-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <AnimatePresence>
        {mobileOpen && <motion.div className="mobile-nav-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />}
      </AnimatePresence>
    </motion.header>
  );
}
