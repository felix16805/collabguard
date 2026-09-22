import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, DM_Sans } from "next/font/google"
import "./globals.css"

// ─── Font loading — self-hosted, zero layout shift ────────────────────────
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  axes: ["opsz"],
})

// ─── Site-wide metadata ───────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://collabguard.vercel.app"
  ),
  title: {
    default: "CollabGuard — Code Similarity and Academic Integrity Detection",
    template: "%s | CollabGuard",
  },
  description:
    "CollabGuard analyzes student code submissions using Winnowing fingerprinting and AST similarity, then surfaces collusion clusters via Louvain community detection on a Neo4j graph database.",
  keywords: [
    "academic integrity",
    "code similarity detection",
    "plagiarism detection",
    "Winnowing",
    "AST fingerprinting",
    "Neo4j",
    "Louvain community detection",
    "student submissions",
    "code analysis",
    "collusion detection",
  ],
  authors: [{ name: "Dipanjan Das" }],
  creator: "Dipanjan Das",
  openGraph: {
    type:        "website",
    siteName:    "CollabGuard",
    title:       "CollabGuard — Code Similarity and Academic Integrity Detection",
    description: "Graph-based collusion detection for academic code submissions. Built on Winnowing, AST fingerprinting, and Neo4j GDS.",
    images: [{
      url:    "/og/home.png",
      width:  1200,
      height: 630,
      alt:    "CollabGuard — similarity graph visualization showing flagged student submission clusters",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "CollabGuard — Code Similarity Detection",
    description: "Graph-based collusion detection using Winnowing + AST + Neo4j",
    images:      ["/og/home.png"],
  },
  robots: {
    index:             true,
    follow:            true,
    googleBot: {
      index:           true,
      follow:          true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon/safari-pinned-tab.svg", color: "#E8960C" },
    ],
  },
  manifest: "/favicon/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor:    "#0D0C0B",
  colorScheme:   "dark light",
  width:         "device-width",
  initialScale:  1,
}

// ─── Root layout ──────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      // data-theme is set by ThemeProvider — default dark
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${dmSans.variable}`}
    >
      <head>
        {/* Plausible analytics — privacy-respecting, no cookies, no banner needed */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
        {/* Preconnect for fonts already handled by next/font */}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
