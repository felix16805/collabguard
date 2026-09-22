"use client"

import type { Metadata } from "next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoginSchema, type LoginInput } from "@/lib/api/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const inputClass = cn(
  "w-full px-3 py-2.5 text-sm",
  "bg-[var(--surface-1)] border border-[var(--border)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "rounded-[var(--radius-sm)]",
  "transition-colors duration-[120ms]",
  "focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-2)]",
  "aria-invalid:border-[var(--error)]",
)

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    })
    if (error) {
      // Intentionally vague — don't reveal whether email exists
      setAuthError("Email or password is incorrect. Check your credentials and try again.")
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
          Sign in
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[var(--accent-text)] hover:text-[var(--accent)]">
            Sign up
          </Link>
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Sign in form"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-[var(--text-primary)]">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@vit.ac.in"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={inputClass}
            {...register("email")}
          />
          {errors.email && (
            <p id="login-email-error" role="alert" aria-live="polite" className="text-xs text-[var(--error)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="login-password" className="text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-text)] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={inputClass}
            {...register("password")}
          />
          {errors.password && (
            <p id="login-password-error" role="alert" aria-live="polite" className="text-xs text-[var(--error)]">
              {errors.password.message}
            </p>
          )}
        </div>

        {authError && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-sm text-[var(--error)] bg-[var(--error-subtle)] border border-[var(--error)]/30 px-4 py-3 rounded-[var(--radius-sm)]"
          >
            {authError}
          </p>
        )}

        <Button type="submit" variant="solid" size="lg" loading={isSubmitting} className="w-full mt-1" id="login-submit">
          Sign in to CollabGuard
        </Button>
      </form>

      <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
        By signing in you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2">terms of use</Link>
        {" "}and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
      </p>
    </>
  )
}
