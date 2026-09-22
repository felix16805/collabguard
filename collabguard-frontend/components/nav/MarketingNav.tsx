"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "/about",    label: "About" },
  { href: "/security", label: "Security" },
  { href: "/contact",  label: "Contact" },
] as const

export function MarketingNav() {
  const pathname  = usePathname()
  const [open, setOpen] = React.useState(false)
  const { scrollY } = useScroll()

  // Transparent at top, surface-1 bg after 40px scroll
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 1])
  const bgOpacity     = useTransform(scrollY, [0, 60], [0, 0.96])

  React.useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{ "--bg-op": bgOpacity } as React.CSSProperties}
      >
        {/* Background layer */}
        <motion.div
          className="absolute inset-0 bg-[var(--bg)] backdrop-blur-md"
          style={{ opacity: bgOpacity }}
        />
        {/* Bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border)]"
          style={{ opacity: borderOpacity }}
        />

        <nav
          className="relative h-full max-w-6xl mx-auto px-6 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Wordmark */}
          <Link
            href="/"
            className="font-display font-semibold text-[var(--text-primary)] tracking-tight text-lg hover:text-[var(--accent)] transition-colors duration-[120ms]"
            aria-label="CollabGuard home"
          >
            CollabGuard
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                role="listitem"
                className={cn(
                  "px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium",
                  "transition-colors duration-[120ms]",
                  pathname === href
                    ? "text-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="solid" size="sm" asChild>
              <Link href="/analysis/demo">Run sample analysis</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span className="sr-only">{open ? "Close" : "Menu"}</span>
            <div className="w-5 h-4 flex flex-col justify-between">
              <motion.span
                className="block h-px bg-current rounded-full"
                animate={open ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-px bg-current rounded-full"
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                className="block h-px bg-current rounded-full"
                animate={open ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </button>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <motion.div
        className="fixed inset-x-0 top-16 z-40 md:hidden bg-[var(--bg)] border-b border-[var(--border)] overflow-hidden"
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-6 py-4 flex flex-col gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium",
                pathname === href
                  ? "text-[var(--accent)] bg-[var(--accent-subtle)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="solid" size="md" asChild>
              <Link href="/analysis/demo">Run sample analysis</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Sticky mobile CTA — visible on marketing pages below nav */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <Button variant="solid" size="lg" className="w-full shadow-[var(--shadow-lg)]" asChild>
          <Link href="/analysis/demo">Run sample analysis</Link>
        </Button>
      </div>
    </>
  )
}
