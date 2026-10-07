"use client";
import React from "react";
import { LogoMark } from "./ManusNav";

export function ManusFooter() {
  return (
    <footer className="site-footer section-frame">
      <div className="footer-brand">
        <LogoMark />
        <span>COLLABGUARD</span>
      </div>
      <p>Built to make indirect similarity visible.</p>
      <span className="footer-note">PROJECT SITE / FRONTEND PROTOTYPE</span>
    </footer>
  );
}
