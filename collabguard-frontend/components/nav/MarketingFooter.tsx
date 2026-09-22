import Link from "next/link"

const FOOTER_LINKS = {
  Product: [
    { label: "Run a sample analysis", href: "/analysis/demo" },
    { label: "About CollabGuard",     href: "/about" },
    { label: "Security posture",      href: "/security" },
  ],
  Legal: [
    { label: "Privacy policy",  href: "/privacy-policy" },
    { label: "Terms of use",    href: "/terms" },
    { label: "Contact",         href: "/contact" },
  ],
  Technical: [
    { label: "BCSE406L — NoSQL Databases", href: "/about#course" },
    { label: "Winnowing algorithm",        href: "/about#winnowing" },
    { label: "Neo4j GDS / Louvain",       href: "/about#graph" },
  ],
} as const

export function MarketingFooter() {
  return (
    <footer
      className="border-t border-[var(--border)] bg-[var(--bg-subtle)]"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-[1fr_auto_auto_auto]">
        {/* Brand column */}
        <div className="flex flex-col gap-4 max-w-xs">
          <Link
            href="/"
            className="font-display font-semibold text-lg text-[var(--text-primary)] tracking-tight hover:text-[var(--accent)] transition-colors"
          >
            CollabGuard
          </Link>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Graph-based code similarity detection for academic integrity.
            Built on Winnowing fingerprinting, AST analysis, and Neo4j community detection.
          </p>
          <p className="text-xs text-[var(--text-muted)] font-mono tracking-wide">
            BCSE406L NS25 — VIT
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group} className="flex flex-col gap-3">
            <span className="text-xs font-display font-semibold tracking-widest uppercase text-[var(--text-muted)]">
              {group}
            </span>
            <ul className="flex flex-col gap-2" role="list">
              {links.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[120ms]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)] max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Dipanjan Das. Academic project — not for commercial use.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Analytics by{" "}
          <a
            href="https://plausible.io"
            className="underline underline-offset-2 hover:text-[var(--text-secondary)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Plausible
          </a>
          {" "}— no cookies, no tracking pixels.
        </p>
      </div>
    </footer>
  )
}
