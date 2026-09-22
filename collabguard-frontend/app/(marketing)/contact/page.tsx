"use client"

import type { Metadata } from "next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ContactSchema, type ContactInput } from "@/lib/api/types"
import { api } from "@/lib/api/mock"
import { cn } from "@/lib/utils"

// Note: metadata can't be exported from a 'use client' component
// In production, move metadata to a server wrapper
const contactDetails = {
  name:  "Dipanjan Das",
  regNo: "[YOUR_REG_NO]",       // TODO: replace before going live
  phone: "[YOUR_PHONE]",        // TODO: replace before going live
  email: "[YOUR_EMAIL@vit.ac.in]", // TODO: replace before going live
  institution: "Vellore Institute of Technology (VIT), Vellore",
  course: "BCSE406L — NoSQL Database, NS25",
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" aria-live="polite" className="text-xs text-[var(--error)] mt-1">
      {message}
    </p>
  )
}

interface LabeledFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  htmlFor: string
}

function LabeledField({ label, required, error, children, htmlFor }: LabeledFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required && <span className="text-[var(--error)] ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  )
}

const inputClass = cn(
  "w-full px-3 py-2.5 text-sm",
  "bg-[var(--surface-1)] border border-[var(--border)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "rounded-[var(--radius-sm)]",
  "transition-colors duration-[120ms]",
  "focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-2)]",
  "aria-invalid:border-[var(--error)]",
)

export default function ContactPage() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
  })

  const onSubmit = async (data: ContactInput) => {
    setSubmitError(null)
    const result = await api.contact.submit(data)
    if (result.ok) {
      router.push("/thank-you")
    } else {
      setSubmitError("Message failed to send. Try emailing directly.")
    }
  }

  return (
    <div className="page-content max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-start">
      {/* Contact details */}
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest">
            Contact
          </p>
          <h1 className="font-display font-semibold text-[var(--text-primary)]">
            Get in touch
          </h1>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For questions about the project, the analysis methodology, or academic collaboration.
          </p>
        </header>

        <div className="flex flex-col gap-6 p-6 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface-1)]">
          {[
            { label: "Name",        value: contactDetails.name },
            { label: "Reg. No",     value: contactDetails.regNo },
            { label: "Phone",       value: contactDetails.phone },
            { label: "Email",       value: contactDetails.email },
            { label: "Institution", value: contactDetails.institution },
            { label: "Course",      value: contactDetails.course },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                {label}
              </span>
              {label === "Email" ? (
                <a
                  href={`mailto:${value}`}
                  className="text-sm text-[var(--accent-text)] hover:text-[var(--accent)] transition-colors"
                >
                  {value}
                </a>
              ) : (
                <span className="text-sm text-[var(--text-primary)]">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="flex flex-col gap-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Contact form"
          className="flex flex-col gap-5"
        >
          {/* Honeypot — hidden from humans, visible to bots */}
          <input
            type="text"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute -left-[9999px] opacity-0 pointer-events-none"
            {...register("_honey")}
          />

          <LabeledField label="Your name" required htmlFor="contact-name" error={errors.name?.message}>
            <input
              id="contact-name"
              type="text"
              placeholder="Arjun Sharma"
              autoComplete="name"
              aria-required="true"
              aria-invalid={!!errors.name}
              className={inputClass}
              {...register("name")}
            />
          </LabeledField>

          <LabeledField label="Email address" required htmlFor="contact-email" error={errors.email?.message}>
            <input
              id="contact-email"
              type="email"
              placeholder="you@institution.edu"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errors.email}
              className={inputClass}
              {...register("email")}
            />
          </LabeledField>

          <LabeledField label="Subject" required htmlFor="contact-subject" error={errors.subject?.message}>
            <input
              id="contact-subject"
              type="text"
              placeholder="Re: CollabGuard methodology"
              aria-required="true"
              aria-invalid={!!errors.subject}
              className={inputClass}
              {...register("subject")}
            />
          </LabeledField>

          <LabeledField label="Message" required htmlFor="contact-message" error={errors.message?.message}>
            <textarea
              id="contact-message"
              rows={6}
              placeholder="Your message (minimum 20 characters)"
              aria-required="true"
              aria-invalid={!!errors.message}
              className={cn(inputClass, "resize-y")}
              {...register("message")}
            />
          </LabeledField>

          {submitError && (
            <p role="alert" className="text-sm text-[var(--error)] bg-[var(--error-subtle)] border border-[var(--error)]/30 px-4 py-3 rounded-[var(--radius-sm)]">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            variant="solid"
            size="lg"
            loading={isSubmitting}
            id="contact-submit"
            className="w-full"
          >
            Send message
          </Button>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Messages are sent via the CollabGuard contact API. See the{" "}
            <a href="/privacy-policy" className="underline underline-offset-2">
              privacy policy
            </a>{" "}
            for how contact data is handled.
          </p>
        </form>
      </div>
    </div>
  )
}
