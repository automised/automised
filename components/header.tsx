import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/20">
            <img
              src="/images/design-mode/a_76d8887e29928844fe2deca7ba7c497b.gif(1).jpeg"
              alt="Automised MM Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-foreground">Automised</span>
            <span className="text-xl font-bold text-primary">MM</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Process
          </Link>
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About Us
          </Link>
          <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
