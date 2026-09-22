"use client"

import type { Metadata } from "next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const AccountSchema = z.object({
  name: z.string().min(2).max(80),
})

const PasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include uppercase")
    .regex(/[0-9]/, "Include a number"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type AccountInput = z.infer<typeof AccountSchema>
type PasswordInput = z.infer<typeof PasswordSchema>

const inputClass = cn(
  "w-full px-3 py-2.5 text-sm",
  "bg-[var(--surface-1)] border border-[var(--border)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "rounded-[var(--radius-sm)]",
  "focus:outline-none focus:border-[var(--accent)]",
  "transition-colors duration-[120ms]",
  "aria-invalid:border-[var(--error)]",
)

const TAB_IDS = ["account", "security"] as const
type Tab = typeof TAB_IDS[number]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account")
  const [accountMsg, setAccountMsg] = useState<string | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  const accountForm = useForm<AccountInput>({ resolver: zodResolver(AccountSchema) })
  const passwordForm = useForm<PasswordInput>({ resolver: zodResolver(PasswordSchema) })

  const onAccountSubmit = async (data: AccountInput) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { name: data.name } })
    setAccountMsg(error ? error.message : "Name updated successfully.")
  }

  const onPasswordSubmit = async (data: PasswordInput) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    setPasswordMsg(error ? error.message : "Password updated successfully.")
    if (!error) passwordForm.reset()
  }

  return (
    <div className="page-content max-w-xl flex flex-col gap-8">
      <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-[var(--border)] flex gap-0" role="tablist" aria-label="Settings sections">
        {TAB_IDS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium capitalize",
              "border-b-2 -mb-px transition-colors duration-[120ms]",
              activeTab === tab
                ? "border-[var(--accent)] text-[var(--accent-text)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Account tab */}
      <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" hidden={activeTab !== "account"}>
        <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-name" className="text-sm font-medium text-[var(--text-primary)]">Display name</label>
            <input
              id="settings-name"
              type="text"
              className={inputClass}
              aria-invalid={!!accountForm.formState.errors.name}
              {...accountForm.register("name")}
            />
            {accountForm.formState.errors.name && (
              <p role="alert" className="text-xs text-[var(--error)]">{accountForm.formState.errors.name.message}</p>
            )}
          </div>
          {accountMsg && <p aria-live="polite" className="text-sm text-[var(--success)]">{accountMsg}</p>}
          <Button type="submit" variant="solid" size="md" loading={accountForm.formState.isSubmitting} id="settings-account-save">
            Save changes
          </Button>
        </form>
      </div>

      {/* Security tab */}
      <div role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden={activeTab !== "security"}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-new-pass" className="text-sm font-medium text-[var(--text-primary)]">New password</label>
            <input
              id="settings-new-pass"
              type="password"
              placeholder="8+ chars, 1 uppercase, 1 number"
              className={inputClass}
              aria-invalid={!!passwordForm.formState.errors.newPassword}
              {...passwordForm.register("newPassword")}
            />
            {passwordForm.formState.errors.newPassword && (
              <p role="alert" className="text-xs text-[var(--error)]">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-confirm-pass" className="text-sm font-medium text-[var(--text-primary)]">Confirm password</label>
            <input
              id="settings-confirm-pass"
              type="password"
              placeholder="••••••••"
              className={inputClass}
              aria-invalid={!!passwordForm.formState.errors.confirmPassword}
              {...passwordForm.register("confirmPassword")}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p role="alert" className="text-xs text-[var(--error)]">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          {passwordMsg && <p aria-live="polite" className={`text-sm ${passwordMsg.includes("success") ? "text-[var(--success)]" : "text-[var(--error)]"}`}>{passwordMsg}</p>}
          <Button type="submit" variant="solid" size="md" loading={passwordForm.formState.isSubmitting} id="settings-password-save">
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
