import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Thank you — CollabGuard",
  description: "Your message has been received.",
  robots: { index: false, follow: false },
}

export default function ThankYouPage() {
  return (
    <div className="page-content min-h-[60svh] flex items-center justify-center px-6">
      <div className="max-w-md flex flex-col gap-6 text-center">
        <div
          className="mx-auto w-12 h-12 rounded-[var(--radius-md)] bg-[var(--success-subtle)] border border-[var(--success)]/30 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10.5l4 4 8-8" stroke="var(--success)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
            Message received
          </h1>
          <p className="text-[var(--text-secondary)]">
            Thanks for reaching out. Expect a response within 48 hours on weekdays.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="solid" size="md" asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button variant="outline" size="md" asChild>
            <Link href="/analysis/demo">Run demo analysis</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
