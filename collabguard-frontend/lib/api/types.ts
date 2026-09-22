/**
 * CollabGuard — Shared API types and Zod schemas
 *
 * These types are shared between:
 *  - The mock API layer (lib/api/mock.ts)
 *  - All form validation schemas
 *  - Server-side route handlers
 *
 * When wiring to the real FastAPI backend, these types must match
 * the backend's response shapes exactly. No changes to the rest of
 * the codebase should be needed — only lib/api/client.ts changes.
 */

import { z } from "zod"

// ─── Submission ────────────────────────────────────────────────────────────

export const SubmissionSchema = z.object({
  id:          z.string().uuid(),
  studentId:   z.string(),
  batchId:     z.string().uuid(),
  filename:    z.string(),
  language:    z.enum(["python", "java", "c", "cpp", "javascript", "typescript", "go", "rust"]),
  sizeBytes:   z.number().int().positive(),
  uploadedAt:  z.string().datetime(),
  analysisStatus: z.enum(["pending", "processing", "complete", "failed"]),
})
export type Submission = z.infer<typeof SubmissionSchema>

// ─── Batch ─────────────────────────────────────────────────────────────────

export const BatchSchema = z.object({
  id:           z.string().uuid(),
  courseId:     z.string().uuid(),
  name:         z.string().min(1).max(120),
  description:  z.string().max(500).optional(),
  createdAt:    z.string().datetime(),
  submissionCount: z.number().int().nonnegative(),
  flaggedPairsCount: z.number().int().nonnegative(),
  status:       z.enum(["collecting", "analyzing", "complete"]),
})
export type Batch = z.infer<typeof BatchSchema>

// ─── Similarity edge ───────────────────────────────────────────────────────

export const SimilarityEdgeSchema = z.object({
  source:      z.string(), // submission id
  target:      z.string(), // submission id
  score:       z.number().min(0).max(1), // 0–1 normalized Winnowing/AST similarity
  method:      z.enum(["winnowing", "ast", "combined"]),
  isFlagged:   z.boolean(),
})
export type SimilarityEdge = z.infer<typeof SimilarityEdgeSchema>

// ─── Graph data ────────────────────────────────────────────────────────────

export const GraphNodeSchema = z.object({
  id:          z.string(),
  studentId:   z.string(),
  label:       z.string(),        // display name
  cluster:     z.number().int().nonnegative(), // Louvain community id
  flagged:     z.boolean(),
  val:         z.number().optional(), // node size weight
})
export type GraphNode = z.infer<typeof GraphNodeSchema>

export const GraphDataSchema = z.object({
  nodes:  z.array(GraphNodeSchema),
  links:  z.array(SimilarityEdgeSchema.extend({
    value: z.number().optional(), // edge thickness weight
  })),
})
export type GraphData = z.infer<typeof GraphDataSchema>

// ─── Report ────────────────────────────────────────────────────────────────

export const ReportSchema = z.object({
  id:          z.string().uuid(),
  batchId:     z.string().uuid(),
  batchName:   z.string(),
  createdAt:   z.string().datetime(),
  flaggedCount: z.number().int().nonnegative(),
  clusterCount: z.number().int().nonnegative(),
  maxSimilarity: z.number().min(0).max(1),
  algorithm:   z.enum(["winnowing", "ast", "combined"]),
  status:      z.enum(["generating", "ready", "archived"]),
})
export type Report = z.infer<typeof ReportSchema>

// ─── Flagged pair ─────────────────────────────────────────────────────────

export const FlaggedPairSchema = z.object({
  id:           z.string().uuid(),
  studentA:     z.string(),
  studentB:     z.string(),
  score:        z.number().min(0).max(1),
  method:       z.enum(["winnowing", "ast", "combined"]),
  snippetA:     z.string().optional(), // code excerpt
  snippetB:     z.string().optional(),
  shortestPath: z.array(z.string()).optional(), // node ids for path highlight
})
export type FlaggedPair = z.infer<typeof FlaggedPairSchema>

// ─── User / Auth ───────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id:          z.string().uuid(),
  email:       z.string().email(),
  name:        z.string().min(1).max(80),
  role:        z.enum(["student", "instructor", "admin"]),
  courseId:    z.string().uuid().optional(),
  avatarUrl:   z.string().url().optional(),
  createdAt:   z.string().datetime(),
})
export type User = z.infer<typeof UserSchema>

// ─── Form schemas ──────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const SignupSchema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters").max(80),
  email:      z.string().email("Enter a valid email address"),
  courseCode: z.string().min(3, "Enter your batch/course code").max(20),
  password:   z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
})
export type SignupInput = z.infer<typeof SignupSchema>

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

export const ResetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
})

export const ContactSchema = z.object({
  name:    z.string().min(2, "Name is required").max(80),
  email:   z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Provide a subject").max(120),
  message: z.string().min(20, "Message must be at least 20 characters").max(2000),
  // honeypot — must be empty if human
  _honey:  z.string().max(0, "Bot detected").optional(),
})
export type ContactInput = z.infer<typeof ContactSchema>

// ─── API response wrapper ──────────────────────────────────────────────────

export type ApiResponse<T> =
  | { ok: true;  data: T;      error?: never }
  | { ok: false; data?: never; error: string }
