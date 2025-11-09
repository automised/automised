"use client"

import { MousePointer2, Users, DollarSign, CheckCircle2 } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: MousePointer2,
      title: "Go to #️⃣ start-deal",
      description:
        "Head to the #️⃣ start-deal channel and click the button to start a Middleman Deal. This will automatically open a private ticket with the Automised bot and staff.",
      label: "Step 1",
    },
    {
      number: "2",
      icon: Users,
      title: "👥 Confirm the Other User",
      description:
        "Inside the ticket, @ or paste the Discord ID of the person you're dealing with. The bot adds the user to the ticket and asks each person to confirm their role as either the Sender or Receiver.",
      label: "Step 2",
    },
    {
      number: "3",
      icon: DollarSign,
      title: "💵 Enter Deal Amount & Send",
      description:
        "Once both users confirm the correct amount being received. The bot generates a unique crypto address and the exact amount to send. The Sender sends the crypto, and the bot monitors for confirmation.",
      label: "Step 3",
    },
    {
      number: "4",
      icon: CheckCircle2,
      title: "✅ Confirm & Release",
      description:
        "Once the funds are confirmed and both users agree, the bot automatically releases the crypto to the Receiver. The deal is completed and the ticket closes. If the server is deleted, the bot restores everything in a backup server.",
      label: "Step 4",
    },
  ]

  return (
    <section className="relative py-24 bg-background" id="process">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">How it works</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Fully Automated. Always Trusted.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our crypto middleman system runs 24/7 with zero error. Fast, fair, and scam proof.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all hover:bg-card/80 hover:border-primary/50"
            >
              <div className="absolute right-4 top-4 text-6xl font-bold text-primary/5 transition-all group-hover:text-primary/10">
                {step.number}
              </div>
              <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <step.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-card-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              <div className="mt-4 inline-flex rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Support message */}
        <div className="mt-16 flex flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">We are with you in every step</h3>
              <p className="text-sm text-muted-foreground">alongside you at each step for seamless experience</p>
            </div>
          </div>
          <button
            onClick={() =>
              window.open(
                "https://discord.com/channels/1407463097475534940/1437131469406470214",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 cursor-pointer"
          >
            Open a ticket in the support channel for assistance.
          </button>
        </div>
      </div>
    </section>
  )
}
