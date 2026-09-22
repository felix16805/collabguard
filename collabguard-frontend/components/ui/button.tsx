/**
 * CollabGuard Button — design-system re-skin of shadcn base
 *
 * Three primary variants: solid (amber CTA), ghost, outline.
 * Uses motion (framer-motion) for press feedback.
 * No generic hover-fade — press scale + color transition.
 * Radius: --radius-sm (4px) for all variants, pill only explicit.
 */
"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 shrink-0",
    "font-display font-medium text-sm tracking-wide whitespace-nowrap",
    "border cursor-pointer select-none",
    "transition-colors",
    "duration-[120ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-3",
    "focus-visible:outline-[var(--accent)]",
    "rounded-[var(--radius-sm)]",
  ].join(" "),
  {
    variants: {
      variant: {
        solid: [
          "bg-[var(--accent)] border-transparent",
          "text-[var(--text-inverted)]",
          "hover:bg-[var(--accent-hover)]",
        ].join(" "),
        ghost: [
          "bg-transparent border-transparent",
          "text-[var(--text-secondary)]",
          "hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
        ].join(" "),
        outline: [
          "bg-transparent border-[var(--border)]",
          "text-[var(--text-primary)]",
          "hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]",
        ].join(" "),
        destructive: [
          "bg-[var(--error-subtle)] border-[var(--error)]/30",
          "text-[var(--error)]",
          "hover:bg-[var(--error)]/20 hover:border-[var(--error)]/50",
        ].join(" "),
        secondary: [
          "bg-[var(--surface-2)] border-[var(--border)]",
          "text-[var(--text-primary)]",
          "hover:bg-[var(--surface-3)]",
        ].join(" "),
      },
      size: {
        sm:   "h-8 px-3 text-xs gap-1.5",
        md:   "h-9 px-4 text-sm",
        lg:   "h-11 px-6 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "solid",
      size:    "md",
    },
  }
)

type ButtonProps = HTMLMotionProps<"button"> & VariantProps<typeof buttonVariants> & {
  loading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, asChild = false, children, ...props }, ref) => {
    const finalClassName = cn(buttonVariants({ variant, size }), className)

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        className: cn(finalClassName, child.props.className),
        ...props,
      } as any)
    }

    return (
      <motion.button
        ref={ref}
        className={finalClassName}
        disabled={disabled || loading}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="sr-only">Loading</span>
          </>
        ) : children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export type { ButtonProps }
