"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

function CallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve all query params and redirect to /api/discord/finish
    const params = new URLSearchParams(searchParams.toString())
    window.location.href = `/api/discord/finish?${params.toString()}`
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
        <p className="text-lg text-foreground font-medium">Completing verification...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we process your request.</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
