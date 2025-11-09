import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Headset } from "lucide-react"

export function SupportSection() {
  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Headset className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            We are with you in every step
          </h2>
          <p className="mb-8 text-muted-foreground">alongside you at each step for seamless experience</p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link
              href="https://discord.com/channels/1407463097475534940/1437131469406470214"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open a ticket in the support channel for assistance.
            </Link>
          </Button>
          {/* </CHANGE> */}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-border pt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Halal MM. All rights reserved.</p>
        </div>
      </footer>
    </section>
  )
}
