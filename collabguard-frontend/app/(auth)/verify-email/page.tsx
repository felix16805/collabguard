import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="16" height="12" rx="2" stroke="var(--accent)" strokeWidth="1.5" />
          <path d="M2 7l8 5 8-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
          Verify your email
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          We sent a verification link to your email address.
          Open the link to activate your account. Check your spam folder if it hasn't arrived in a few minutes.
        </p>
      </div>
      <Button variant="outline" size="md" asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  )
}
