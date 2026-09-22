"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ForgotPasswordSchema } from "@/lib/api/types"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import { cn } from "@/lib/utils"

type ForgotInput = z.infer<typeof ForgotPasswordSchema>

const inputClass = cn(
  "w-full px-3 py-2.5 text-sm",
  "bg-[var(--surface-1)] border border-[var(--border)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "rounded-[var(--radius-sm)]",
  "transition-colors duration-[120ms]",
  "focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-2)]",
  "aria-invalid:border-[var(--error)]",
)

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotInput) => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${location.origin}/reset-password`,
    })
    // Always show success — don't reveal whether email exists in system
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--success-subtle)] border border-[var(--success)]/30 flex items-center justify-center" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10.5l4 4 8-8" stroke="var(--success)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">Check your email</h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          If that email address is registered, you'll receive a password reset link within a few minutes.
          Check your spam folder if it doesn't appear.
        </p>
        <Link href="/login" className="text-sm text-[var(--accent-text)] hover:text-[var(--accent)]">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">Reset password</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Enter the email address you registered with.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="forgot-email" className="text-sm font-medium text-[var(--text-primary)]">Email address</label>
          <input
            id="forgot-email"
            type="email"
            placeholder="you@vit.ac.in"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            className={inputClass}
            {...register("email")}
          />
          {errors.email && <p role="alert" aria-live="polite" className="text-xs text-[var(--error)]">{errors.email.message}</p>}
        </div>

        <Button type="submit" variant="solid" size="lg" loading={isSubmitting} className="w-full" id="forgot-submit">
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
        Back to sign in
      </Link>
    </>
  )
}
