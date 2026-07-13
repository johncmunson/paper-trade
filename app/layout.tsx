import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Paper Trade API Reference",
  description:
    "Private API for simulated brokerage accounts and on-demand market data. Manage brokerage accounts, cash movements, market orders, and tradable securities.",
  applicationName: "Paper Trade API",
  keywords: [
    "Paper Trade",
    "API reference",
    "brokerage",
    "market orders",
    "securities",
    "documentation",
  ],
  openGraph: {
    title: "Paper Trade API Reference",
    description:
      "Private API for simulated brokerage accounts and on-demand market data.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#22252b" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <head>
        <script
          // Set theme before paint to avoid a flash of the wrong color scheme.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pt-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
