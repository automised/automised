export function FeaturesSection() {
  const features = [
    {
      title: "Automated Escrow System",
      description:
        "Funds are held securely in an automated wallet until both parties confirm the deal — no manual handling, no risk.",
      icon: "🔒",
    },
    {
      title: "Step-by-Step Deal Flow",
      description:
        "From start to release, every part of the deal is guided by the bot. No confusion. No skipped steps.",
      icon: "📋",
    },
    {
      title: "Ticket-Based Support",
      description:
        "All deals happen inside private Discord tickets — fully logged, trackable, and recoverable at any time.",
      icon: "🎫",
    },
    {
      title: "Instant Ticket Recovery",
      description:
        "If the server is ever deleted, your entire deal (including messages) is automatically restored in a new server.",
      icon: "💾",
    },
    {
      title: "Multi-Coin Support",
      description:
        "Supports major cryptocurrencies like Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH), and Solana (SOL) — more coming soon.",
      icon: "💰",
    },
    {
      title: "Low Fees",
      description:
        "Our middleman services have the lowest fees compared to competitors. You'll always see any fees upfront before a deal starts.",
      icon: "💵",
    },
    {
      title: "Fast Transactions",
      description: "Built for speed. Deals usually complete in under 15 minutes depending on the crypto used.",
      icon: "⚡",
    },
    {
      title: "24/7 Automation",
      description:
        "No staff required to process deals. The bot is online 24/7 and handles everything from start to finish.",
      icon: "🤖",
    },
  ]

  return (
    <section className="relative py-24 bg-muted/30" id="features">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">Features</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">Why use Automised?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Built for users who want speed, trust, and automation.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 transition-all hover:bg-card/80 hover:border-primary/50"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-3xl">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
