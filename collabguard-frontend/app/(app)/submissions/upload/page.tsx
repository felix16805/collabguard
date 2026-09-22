"use client"

import type { Metadata } from "next"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/mock"
import { isAllowedFile, formatBytes, ALLOWED_EXTENSIONS } from "@/lib/utils"
import Link from "next/link"

const UploadFormSchema = z.object({
  batchName: z.string().min(3, "Batch name must be at least 3 characters").max(120),
  courseCode: z.string().min(2, "Course code required").max(20),
})
type UploadForm = z.infer<typeof UploadFormSchema>

interface FileState {
  file: File
  status: "pending" | "uploading" | "done" | "error"
  progress: number
  error?: string
}

const inputClass = [
  "w-full px-3 py-2.5 text-sm",
  "bg-[var(--surface-1)] border border-[var(--border)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "rounded-[var(--radius-sm)]",
  "transition-colors duration-[120ms]",
  "focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-2)]",
  "aria-invalid:border-[var(--error)]",
].join(" ")

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<FileState[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UploadForm>({
    resolver: zodResolver(UploadFormSchema),
  })

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const validated: FileState[] = arr.map(file => {
      const check = isAllowedFile(file)
      return {
        file,
        status: check.ok ? "pending" : "error",
        progress: 0,
        error: check.reason,
      }
    })
    setFiles(prev => {
      const names = new Set(prev.map(f => f.file.name))
      return [...prev, ...validated.filter(f => !names.has(f.file.name))]
    })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== name))
  }

  const onSubmit = async (data: UploadForm) => {
    setUploadError(null)
    const validFiles = files.filter(f => f.status === "pending").map(f => f.file)
    if (validFiles.length === 0) {
      setUploadError("Add at least one valid file before uploading.")
      return
    }

    // Simulate per-file progress
    for (const f of files) {
      if (f.status !== "pending") continue
      setFiles(prev => prev.map(p => p.file.name === f.file.name ? { ...p, status: "uploading", progress: 0 } : p))
      // Animate progress
      for (let pct = 20; pct <= 100; pct += 20) {
        await new Promise(r => setTimeout(r, 150))
        setFiles(prev => prev.map(p => p.file.name === f.file.name ? { ...p, progress: pct } : p))
      }
      setFiles(prev => prev.map(p => p.file.name === f.file.name ? { ...p, status: "done", progress: 100 } : p))
    }

    const res = await api.submissions.upload(validFiles, data.batchName)
    if (!res.ok) {
      setUploadError("Upload failed. Please try again.")
      return
    }
    router.push("/dashboard")
  }

  const pendingCount = files.filter(f => f.status === "pending").length
  const errorCount   = files.filter(f => f.status === "error").length

  return (
    <div className="page-content max-w-2xl flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
        <h1 className="font-display font-semibold text-2xl text-[var(--text-primary)]">
          Upload submission batch
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Accepted file types: {ALLOWED_EXTENSIONS.join(", ")} · Max 10 MB per file
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Batch metadata */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="batch-name" className="text-sm font-medium text-[var(--text-primary)]">
              Batch name <span className="text-[var(--error)]" aria-hidden>*</span>
            </label>
            <input
              id="batch-name"
              type="text"
              placeholder="BCSE406L NS25 — Lab 3"
              aria-required="true"
              aria-invalid={!!errors.batchName}
              className={inputClass}
              {...register("batchName")}
            />
            {errors.batchName && (
              <p role="alert" aria-live="polite" className="text-xs text-[var(--error)]">
                {errors.batchName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="course-code" className="text-sm font-medium text-[var(--text-primary)]">
              Course/Batch code <span className="text-[var(--error)]" aria-hidden>*</span>
            </label>
            <input
              id="course-code"
              type="text"
              placeholder="NS25"
              aria-required="true"
              aria-invalid={!!errors.courseCode}
              className={inputClass}
              {...register("courseCode")}
            />
            {errors.courseCode && (
              <p role="alert" aria-live="polite" className="text-xs text-[var(--error)]">
                {errors.courseCode.message}
              </p>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop zone — drag and drop source code files here, or click to browse"
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => document.getElementById("file-input")?.click()}
          onKeyDown={e => e.key === "Enter" && document.getElementById("file-input")?.click()}
          className={[
            "border-2 border-dashed rounded-[var(--radius-md)] p-10 text-center cursor-pointer",
            "transition-all duration-[200ms]",
            isDragOver
              ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
              : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-1)]",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Drop source files here
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            or click to browse — {ALLOWED_EXTENSIONS.join(" ")}
          </p>
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(",")}
          className="sr-only"
          aria-hidden="true"
          onChange={e => { if (e.target.files) addFiles(e.target.files) }}
        />

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 overflow-hidden"
              role="list"
              aria-label="Selected files"
            >
              {files.map(({ file, status, progress, error: fileError }) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--surface-1)] border border-[var(--border)]"
                  role="listitem"
                >
                  <span
                    className="font-mono text-xs shrink-0 px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)]"
                    aria-hidden="true"
                  >
                    {file.name.split(".").pop()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{file.name}</p>
                    {fileError && <p className="text-xs text-[var(--error)]">{fileError}</p>}
                    {status === "uploading" && (
                      <div className="mt-1 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[var(--accent)] rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{formatBytes(file.size)}</span>
                  <span
                    className="text-xs font-mono shrink-0"
                    style={{
                      color: status === "done" ? "var(--success)" : status === "error" ? "var(--error)" : status === "uploading" ? "var(--accent-text)" : "var(--text-muted)",
                    }}
                    aria-live="polite"
                  >
                    {status === "done" ? "done" : status === "error" ? "error" : status === "uploading" ? `${progress}%` : "pending"}
                  </span>
                  {status !== "uploading" && status !== "done" && (
                    <button
                      type="button"
                      onClick={() => removeFile(file.name)}
                      className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors text-lg leading-none"
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {uploadError && (
          <p role="alert" aria-live="assertive" className="text-sm text-[var(--error)] bg-[var(--error-subtle)] border border-[var(--error)]/30 px-4 py-3 rounded-[var(--radius-sm)]">
            {uploadError}
          </p>
        )}

        {errorCount > 0 && (
          <p className="text-sm text-[var(--error)]" aria-live="polite">
            {errorCount} file{errorCount > 1 ? "s" : ""} cannot be uploaded — check the errors above.
          </p>
        )}

        <Button
          type="submit"
          variant="solid"
          size="lg"
          loading={isSubmitting}
          disabled={pendingCount === 0 || isSubmitting}
          id="upload-submit"
          className="w-full"
        >
          Upload {pendingCount > 0 ? `${pendingCount} file${pendingCount > 1 ? "s" : ""}` : "files"}
        </Button>
      </form>
    </div>
  )
}
