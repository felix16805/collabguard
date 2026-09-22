# CollabGuard — Frontend Build

You are building the **entire frontend** for **CollabGuard**, a graph-based academic integrity / code-collusion detection system, from an empty repository. Read this whole document before writing any code. Do not skip the anti-pattern section — it is enforced, not a suggestion.

## 0. Project Context

- **Product**: CollabGuard — analyzes student code submissions, builds a similarity graph (Winnowing/AST fingerprinting), and surfaces collusion clusters via graph algorithms (Louvain community detection, shortest path) run on Neo4j. MongoDB stores raw submissions/documents.
- **Origin**: Academic course project (BCSE406L, NoSQL Database, VIT), Batch ID NS25, built by Dipanjan Das under faculty guide Dr. D. Vivek — but the frontend should read as a real, shippable product, not a student demo.
- **Backend**: Python FastAPI + MongoDB (documents) + Neo4j (graph), JWT auth. This prompt covers **frontend only**, but wire it against a mocked/typed API layer so it's a one-line swap to the real backend.
- **Scope for this pass**: full frontend — marketing/landing site, auth, in-app product (dashboard, submission upload, analysis/graph view, reports), and every supporting page a real product needs (see §4).

## 1. Design Direction

**One sentence brief**: Apple-keynote restraint meets a quiet, surreal graph-space — dark by default, precise typography, one real 3D/canvas centerpiece instead of five fake ones, motion that clarifies state rather than decorates it.

Concretely:
- **Mood**: surrealism as *restraint and strangeness in one deliberate place* (e.g. an actual WebGL/canvas render of the similarity graph as the hero, warped/parallax subtly on scroll) — not surreal illustration clip-art everywhere.
- **Feel**: sleek, dense information design, generous negative space, confident dark mode as the primary theme with a true light mode (not an inverted afterthought).
- **Reference direction** (mine for craft, layout logic, type pairing, motion restraint — do not copy verbatim):
  - designskills.dev, arpeggio.framer.website, pacomepertant.com, godly.design/websites — for layout confidence and typographic hierarchy.
  - frontend-joe/react-components Login10 — for the auth screen's structural idea (not literal reuse), adapted to our color/type system.
  - DavidHDev/react-bits — component-level motion/interaction patterns.
- **Color**: pick ONE real accent (not purple, not a purple→blue gradient) — earned through Realtime Colors, tested for AA contrast in both themes. Neutral dark background must be a true near-black with subtle warmth or coolness (not pure `#000`), not glassmorphism panels.
- **Type**: two typefaces max, chosen deliberately — explicitly **not** Inter-everywhere and **not** the Space Grotesk + Instrument Serif combo (overused). Pick something with real personality and justify the pairing in a code comment at the top of the theme file.
- **3D/canvas**: the graph visualization (nodes = submissions, edges = similarity) should be the actual hero visual, rendered live (or a captured/looping real render), not a decorative unrelated 3D blob.

### Hard "no" list — reject any output containing these

Gradient blobs · purple-to-blue gradients or gradient hero text · circle icon chips · floating fake 3D shapes unrelated to the product · identical/interchangeable feature cards · stock team photos · rainbow accent colors · fake product screenshots · buzzword copy ("revolutionize", "seamless", "unlock") · generic testimonials · three-word punchy headlines · FAQ sections that restate the page · bento grids · emojis in UI or headings · vague CTAs ("Get Started" with no object) · dead links/placeholder hrefs · soft/rounded-everywhere corner radii with no system behind them · glassmorphism cards · low-contrast dark mode · three-icons-in-a-row feature rows · a badge pill above every headline · Lucide icons dropped in without a consistent icon system · untouched default shadcn styling · fade-in-on-scroll as the only motion idea · cursor-following blob/beam effects · generic hover-fade buttons and nothing else · inconsistent spacing (no 4/8px scale) · em dashes used as a copy tic · serif italic accent words · grain texture over a gradient.

If a generated screen matches 2+ items on this list, redo it.

## 2. Tech Stack

- **Framework**: Next.js (App Router), TypeScript strict mode.
- **Styling/components**: Tailwind + shadcn/ui as the *base primitives only* — every shadcn component must be re-skinned to match our design tokens, never left at default. Layer in:
  - `react-bits` for interaction-level components (buttons, text reveals, cursors) — install per-component via jsrepo, not the whole lib.
  - `kokonut-ui` for ready-made animated components where they fit our system (evaluate each one against §1's "no" list before using).
  - `bklit-ui` (or the closest maintained equivalent available) for the analytics/reporting charts and data visuals in the dashboard.
  - `motion` (Motion.dev / Framer Motion successor) for all cover/layout transitions and hover/press interactions — one motion library only, no mixing.
- **3D/canvas**: `three.js` (or `react-three-fiber` if the team wants declarative 3D) for the graph hero visualization; fall back to a 2D canvas/D3 force-graph render for lower-end devices.
- **Backend-as-a-service**: use **Supabase** for auth session storage, file uploads (submission files), and Postgres-backed app data (users, courses, submission metadata) — reserve MongoDB/Neo4j for the analysis engine behind the FastAPI service. Use **Convex** only if real-time collaborative state (e.g. live-updating collusion graph while a batch processes) is needed; otherwise Supabase realtime channels are enough — don't add both without a concrete reason.
- **Forms/validation**: `react-hook-form` + `zod`.
- **Package/component tooling**:
  ```bash
  npx jsrepo init
  npx shadcn@latest mcp init --client claude
  npx shadcn@latest add @react-bits/BlurText-TS-TW   # example — add components one at a time, review each
  npm install -g @playwright/cli
  ```
- **Skills/plugins to load into the agent session before building UI**:
  ```bash
  npx skills add Leonxlnx/taste-skill
  npx skills add nutlope/hallmark
  npx skills add miqdadbadjuber/anti-slop
  ```
  Also load: a general web-design-guidelines skill, an "awesome design" reference skill, an image-to-code skill (for turning the reference screenshots into structure, never into 1:1 copies), and Playwright CLI for visual QA passes after each page is built. Run the **anti-slop** and **taste-skill** checks against every page before marking it done.
- **Testing/QA**: Playwright for visual regression + basic e2e (auth flow, upload flow); run an accessibility pass (axe) per page.

## 3. Build Order

1. Repo scaffold: Next.js + TS + Tailwind + shadcn init, ESLint/Prettier, commit hooks.
2. Design tokens: color system (dark + light), type scale, spacing scale (4/8px), radius scale, motion easing/duration tokens — one `theme.ts`/`tailwind.config` source of truth.
3. Primitive layer: re-skinned shadcn primitives (button, input, dialog, dropdown, tabs, table, card, toast).
4. Marketing site (public, logged-out): Home, About, Pricing/Plans (if applicable), Security, Privacy, Terms, Contact, 404.
5. Auth flow: Sign up, Log in, Forgot/reset password, Email verification screen.
6. Product app (logged-in): Dashboard, Upload Submission, Batch/Course view, Analysis view (graph), Report detail, Reports list/export, Account Settings.
7. Shared chrome: nav, footer, command palette (optional), loading states, empty states, error boundaries, thank-you page after form submits.
8. Security hardening pass (§5).
9. SEO/site-hygiene pass (§6).
10. Playwright visual QA + anti-slop skill check on every route.

## 4. Required Pages/Routes

**Public/marketing**
- `/` — Home. Hero *is* the live/rendered similarity-graph visual. Real product explanation, real screenshots of the actual dashboard/graph (not fake mockups), a concrete CTA (e.g. "Run a sample analysis" / "Request access") — not a vague "Get Started".
- `/about` — About the project + the author (Dipanjan Das), faculty guide, academic context, and the real technical approach (Winnowing/AST, Neo4j GDS). This is a credibility page, written like an engineering blog post, not a bio card grid.
- `/security` — plain-English explanation of the security posture (ties to §5) — genuinely useful, not decorative.
- `/privacy-policy`
- `/terms`
- `/contact` — real contact details: name, registration number, phone, email (pull the actual values from the user, do not fabricate placeholders).
- `/thank-you` — after contact/form submit.
- `404` (custom, on-brand, not the framework default).

**Auth**
- `/login`
- `/signup`
- `/forgot-password`, `/reset-password`
- `/verify-email`

**App (authenticated)**
- `/dashboard` — overview: recent batches, flagged pairs, quick stats.
- `/submissions/upload` — upload flow with real form error states and progress/loading states.
- `/submissions/[batchId]` — batch detail, list of submissions.
- `/analysis/[batchId]` — the graph view: nodes/edges, similarity scores, cluster highlighting (Louvain output), shortest-path explanation between two flagged nodes.
- `/reports` — list, filter, export.
- `/reports/[id]` — single report detail, exportable.
- `/settings` — account, security (password/session management), notification prefs.

## 5. Security Requirements (build these in, don't bolt on later)

- No API keys or secrets in client bundles or git history — verify with a secret scan before each commit; use env vars server-side only, expose only the Supabase **public/anon** key client-side.
- Enable **Row Level Security** on every Supabase table; write explicit policies, don't rely on defaults.
- Encrypt sensitive fields at rest where applicable; never log sensitive data.
- All privileged logic (auth checks, record ownership checks) enforced **server-side** — never trust client-side gating alone.
- Lock record access to the owning user/course; block field-level tampering on updates (whitelist mutable fields).
- Secure, httpOnly, SameSite session cookies.
- Hash passwords (Supabase auth handles this — don't roll your own).
- Rate-limit login and any public form endpoints; add bot protection (e.g. a lightweight CAPTCHA or honeypot) on public forms.
- Parameterized queries everywhere (Supabase client handles this by default — don't string-concatenate raw SQL anywhere).
- Validate and sanitize all input server-side with zod schemas shared between client and server where possible; escape all user-generated content on render.
- Restrict file uploads: type/size allowlist, virus/type-sniff check, private storage bucket with signed URLs.
- Trim API responses to only what the client needs (no over-fetching sensitive fields).
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) set at the edge/middleware level.
- Force HTTPS everywhere, HSTS enabled.
- Run a dependency vulnerability scan as part of CI (e.g. `npm audit` / a security-audit skill/plugin) before merge.

## 6. SEO & Site Hygiene Checklist

- CTA above the fold on every marketing page.
- Unique `<title>` and meta description per page.
- Open Graph image (real, product-specific — not a generic template) per key page.
- Full favicon set (all sizes + manifest).
- `robots.txt` and `sitemap.xml`.
- Alt text on every meaningful image; decorative images marked `alt=""`.
- Mobile breakpoints tested down to ~360px; sticky mobile CTA on marketing pages.
- Loading states for every async view (skeletons, not spinners-only, where content shape is known).
- Form error states: inline, specific, accessible (aria-live where appropriate).
- Cookie banner (only if you actually set non-essential cookies — otherwise say so and skip it).
- Analytics installed (privacy-respecting; document what's tracked, referenced from `/privacy-policy`).
- Images compressed/served in modern formats (AVIF/WebP) — only where it doesn't degrade the intentional visual detail of the 3D/canvas hero.

## 7. Definition of Done (per page)

A page is done only when:
1. It passes the anti-slop / taste-skill check.
2. It works in dark and light mode with AA contrast.
3. It has real copy (no lorem ipsum, no buzzwords) — pull real specifics from the CollabGuard project (Winnowing, AST, Neo4j GDS, Louvain, MongoDB+Neo4j polyglot persistence) instead of generic SaaS language.
4. It has working loading, empty, and error states.
5. Playwright visual + a11y check passes.
6. No item from the §1 "no" list appears anywhere on it.

---

**Instruction to the agent**: install everything listed in §2 from a clean repo, follow the build order in §3 exactly, implement every page in §4, and do not consider the frontend complete until every checklist item in §5–§7 is satisfied. Ask for the real contact details (name/reg no/phone/email) and any brand-specific decisions (final accent color, typeface pairing) before hardcoding placeholders — do not invent fake contact information.
