import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind class names without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a similarity score (0–1) to a percentage string */
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** Determine the severity level of a similarity score */
export function scoreLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 0.85) return "critical"
  if (score >= 0.70) return "high"
  if (score >= 0.50) return "medium"
  return "low"
}

/** Format a date to a readable string */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day:      "2-digit",
    month:    "short",
    year:     "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(date))
}

/** Format bytes to human-readable size */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k     = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i     = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + "…"
}

/** Validate allowed file types for submission uploads */
export const ALLOWED_EXTENSIONS = [".py", ".java", ".c", ".cpp", ".js", ".ts", ".go", ".rs"] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function isAllowedFile(file: File): { ok: boolean; reason?: string } {
  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return { ok: false, reason: `File type '${ext}' is not accepted. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, reason: `File exceeds 10 MB limit (${formatBytes(file.size)})` }
  }
  return { ok: true }
}
