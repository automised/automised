export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Automised MM. All rights reserved.</p>
      </div>
    </footer>
  )
}
