import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Automised MM - Automated Middleman Services",
  description: "Trusted crypto middleman bot running 24/7. Fast, fair, and scam proof.",
  icons: {
    icon: "/favicon.ico", // Single favicon file
    apple: "/apple-icon.png",
  },
    generator: 'v0.app'
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
