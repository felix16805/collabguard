"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignupSchema, type SignupInput } from "@/lib/api/types"
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

type FieldName = "name" | "email" | "courseCode" | "password" | "confirmPassword"

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" aria-live="polite" className="text-xs text-[var(--error)]">{error}</p>}
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
  })

  const fieldError = (name: FieldName) => errors[name]?.message

  const onSubmit = async (data: SignupInput) => {
    setAuthError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  {
        data:         { name: data.name, courseCode: data.courseCode },
        emailRedirectTo: `${location.origin}/verify-email`,
      },
    })
    if (error) {
      setAuthError(error.message)
      return
    }
    router.push("/verify-email")
  }

  const fields: Array<{ id: string; name: FieldName; label: string; type: string; placeholder: string; autoComplete: string }> = [
    { id: "signup-name",        name: "name",            label: "Full name",       type: "text",     placeholder: "Arjun Sharma",      autoComplete: "name" },
    { id: "signup-email",       name: "email",           label: "Email address",   type: "email",    placeholder: "you@vit.ac.in",     autoComplete: "email" },
    { id: "signup-coursecode",  name: "courseCode",      label: "Batch/Course code", type: "text",   placeholder: "NS25",              autoComplete: "off" },
    { id: "signup-password",    name: "password",        label: "Password",        type: "password", placeholder: "8+ chars, 1 uppercase, 1 number", autoComplete: "new-password" },
    { id: "signup-confirm",     name: "confirmPassword", label: "Confirm password", type: "password", placeholder: "••••••••",          autoComplete: "new-password" },
  ]

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">Create account</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent-text)] hover:text-[var(--accent)]">Sign in</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Sign up form" className="flex flex-col gap-4">
        {fields.map(({ id, name, label, type, placeholder, autoComplete }) => (
          <Field key={id} id={id} label={label} error={fieldError(name)}>
            <input
              id={id}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-required="true"
              aria-invalid={!!errors[name]}
              aria-describedby={errors[name] ? `${id}-error` : undefined}
              className={inputClass}
              {...register(name)}
            />
          </Field>
        ))}

        {authError && (
          <p role="alert" aria-live="assertive" className="text-sm text-[var(--error)] bg-[var(--error-subtle)] border border-[var(--error)]/30 px-4 py-3 rounded-[var(--radius-sm)]">
            {authError}
          </p>
        )}

        <Button type="submit" variant="solid" size="lg" loading={isSubmitting} className="w-full mt-1" id="signup-submit">
          Create account
        </Button>
      </form>

      <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
        By signing up you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2">terms of use</Link>
        {" "}and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
      </p>
    </>
  )
}
