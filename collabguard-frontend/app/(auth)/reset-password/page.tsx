"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ResetPasswordSchema } from "@/lib/api/types"
import { createClient } from "@/lib/supabase/client"
import { z } from "zod"
import { cn } from "@/lib/utils"

type ResetInput = z.infer<typeof ResetPasswordSchema>

const inputClass = cn(
  "w-full px-3 py-2.5 text-sm",
  "bg-[var(--surface-1)] border border-[var(--border)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "rounded-[var(--radius-sm)]",
  "focus:outline-none focus:border-[var(--accent)]",
  "transition-colors duration-[120ms]",
  "aria-invalid:border-[var(--error)]",
)

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetInput>({
    resolver: zodResolver(ResetPasswordSchema),
  })

  const onSubmit = async (data: ResetInput) => {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password: data.password })
    if (authError) { setError(authError.message); return }
    router.push("/dashboard")
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
          Set new password
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {[
          { id: "reset-pass",    name: "password" as const,        label: "New password",      ph: "8+ chars, 1 uppercase, 1 number" },
          { id: "reset-confirm", name: "confirmPassword" as const,  label: "Confirm password",  ph: "••••••••" },
        ].map(({ id, name, label, ph }) => (
          <div key={id} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
            <input id={id} type="password" placeholder={ph} className={inputClass}
              aria-invalid={!!errors[name]} {...register(name)} />
            {errors[name] && <p role="alert" aria-live="polite" className="text-xs text-[var(--error)]">{errors[name]!.message}</p>}
          </div>
        ))}

        {error && <p role="alert" aria-live="assertive" className="text-sm text-[var(--error)] bg-[var(--error-subtle)] border border-[var(--error)]/30 px-4 py-3 rounded-[var(--radius-sm)]">{error}</p>}

        <Button type="submit" variant="solid" size="lg" loading={isSubmitting} className="w-full" id="reset-submit">
          Set password
        </Button>
      </form>
    </>
  )
}
