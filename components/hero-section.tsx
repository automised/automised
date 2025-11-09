import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      <div className="absolute right-[200px] top-1/4 h-[600px] w-[600px] opacity-30 mix-blend-screen">
        <img
          src="/images/design-mode/robot_transparent_fadeout.gif"
          alt="Background"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="absolute right-[200px] top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[150px]" />
      {/* </CHANGE> */}

      <div className="container relative mx-auto px-4 py-20">
        <div className="flex flex-col justify-center min-h-[calc(100vh-10rem)] space-y-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 w-fit">
            <span className="text-sm text-muted-foreground">Automated Middleman Services</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Automised <span className="text-primary">MM</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Powered by the Automised Discord Bot. Backed by a growing community across Roblox, Telegram, and Discord.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="https://discord.gg/ym4CvA2sc4" target="_blank" rel="noopener noreferrer">
                Join Our Discord
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border bg-transparent hover:bg-muted" asChild>
              <Link href="https://t.me/automisedmm" target="_blank" rel="noopener noreferrer">
                Join our Telegram
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </section>
  )
}
