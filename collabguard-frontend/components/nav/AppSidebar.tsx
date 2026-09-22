"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type NavItem = { href: string; label: string; icon: React.ReactNode }

function GraphIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5" y1="7.3" x2="11" y2="4.7" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5" y1="8.7" x2="11" y2="11.3" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 10V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 11v1a1.5 1.5 0 001.5 1.5h8A1.5 1.5 0 0013.5 12v-1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <line x1="5" y1="5.5" x2="11" y2="5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="5" y1="10.5" x2="8.5" y2="10.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",           label: "Dashboard",  icon: <DashIcon /> },
  { href: "/submissions/upload",  label: "Upload",     icon: <UploadIcon /> },
  { href: "/analysis/demo",       label: "Analysis",   icon: <GraphIcon /> },
  { href: "/reports",             label: "Reports",    icon: <ReportIcon /> },
  { href: "/settings",            label: "Settings",   icon: <SettingsIcon /> },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r border-[var(--border)] bg-[var(--bg-subtle)]",
        "transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "w-14" : "w-52"
      )}
      aria-label="Application navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[var(--border)]">
        {!collapsed && (
          <Link
            href="/"
            className="font-display font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
          >
            CollabGuard
          </Link>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d={collapsed ? "M4 7h6M4 4h6M4 10h6" : "M2 4h10M2 7h10M2 10h10"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 flex flex-col gap-1" aria-label="Main app navigation">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-sm)] text-sm font-medium",
                "transition-colors duration-[120ms]",
                active
                  ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-[var(--border)]">
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-sm)] text-sm",
            "text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)]",
            "transition-colors duration-[120ms]",
          )}
          aria-label="Sign out"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
