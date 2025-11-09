"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Is Automised Middleman safe to use?",
      answer:
        "Yes! All funds are held in automated escrow wallets. The bot handles everything securely without human error. Every transaction is logged and recoverable.",
    },
    {
      question: "How do I know I'm in the real Automised server?",
      answer:
        "Always join through our official links. Check the server ID and verify our Discord bot is present. Never trust DMs claiming to be support staff.",
    },
    {
      question: "What coins are supported?",
      answer:
        "We currently support Bitcoin (BTC), Litecoin (LTC), Ethereum (ETH), and Solana (SOL). More cryptocurrencies are being added regularly.",
    },
    {
      question: "How do I start a deal?",
      answer:
        "Go to the #start-deal channel in our Discord server and click the button. The bot will create a private ticket and guide you through each step automatically.",
    },
    {
      question: "Are there any fees?",
      answer:
        "Yes, but they're among the lowest in the industry. All fees are shown upfront before the deal starts so there are no surprises.",
    },
    {
      question: "Can I cancel a deal after it starts?",
      answer:
        "Yes, deals can be cancelled before funds are sent. Once crypto is sent, both parties must agree to proceed or the funds will be held in escrow until resolved.",
    },
    {
      question: "How long does a typical deal take?",
      answer:
        "Most deals complete in under 15 minutes. The exact time depends on the cryptocurrency used and network confirmation speeds.",
    },
  ]

  return (
    <section className="relative py-24 bg-muted/30" id="faq">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">FAQ</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            Questions, <span className="text-muted-foreground">Answers</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">Get quick answers to most of your questions</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-medium text-card-foreground pr-8">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
