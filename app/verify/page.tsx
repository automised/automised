"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react"

function VerifyContent() {
  const searchParams = useSearchParams()
  const ok = searchParams.get("ok")
  const reason = searchParams.get("reason")
  const isSuccess = ok === "1"

  const [verifiedUser, setVerifiedUser] = useState<{ name: string; id: string } | null>(null)

  useEffect(() => {
    // Try to read verified_user cookie
    if (isSuccess) {
      const cookies = document.cookie.split("; ")
      const verifiedUserCookie = cookies.find((c) => c.startsWith("verified_user="))
      if (verifiedUserCookie) {
        try {
          const value = decodeURIComponent(verifiedUserCookie.split("=")[1])
          setVerifiedUser(JSON.parse(value))
        } catch (e) {
          console.error("Failed to parse verified_user cookie:", e)
        }
      }
    }
  }, [isSuccess])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Grid background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <main className="container mx-auto flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="w-full max-w-2xl">
          {/* Icon with glow effect */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Glow effect */}
              <div
                className={`absolute inset-0 blur-3xl opacity-40 ${isSuccess ? "bg-primary" : "bg-destructive"}`}
                style={{ transform: "scale(1.5)" }}
              />

              {/* Icon container */}
              <div
                className={`relative rounded-3xl p-8 ${
                  isSuccess
                    ? "bg-primary/10 border-2 border-primary/30"
                    : "bg-destructive/10 border-2 border-destructive/30"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="h-20 w-20 text-primary" strokeWidth={2} />
                ) : (
                  <XCircle className="h-20 w-20 text-destructive" strokeWidth={2} />
                )}
              </div>
            </div>
          </div>

          {/* Title and subtitle */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              {isSuccess ? "Verification Successful" : "Verification Failed"}
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              {isSuccess
                ? "Thank you for verifying yourself, you can now view and access the entire server and enjoy all the features of our service."
                : "Verification has failed, please try again to gain access to our entire server and features."}
            </p>
          </div>

          {/* Verified user info */}
          {isSuccess && verifiedUser && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Verified as <span className="text-foreground font-semibold">{verifiedUser.name}</span>
              </p>
            </div>
          )}

          {/* Reason box for failed verification */}
          {!isSuccess && reason && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">Reason</p>
              <p className="text-sm text-foreground">{reason}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isSuccess ? (
              <>
                <Button size="lg" className="gap-2" onClick={() => window.open("https://discord.com/app", "_blank")}>
                  Open Discord
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/">Back to site</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => (window.location.href = "/api/discord/start")}>
                  Try again
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={() => window.open("https://discord.com/app", "_blank")}
                >
                  Open Discord
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
