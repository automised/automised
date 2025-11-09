"use client"

import { useEffect, useState } from "react"

interface TeamMember {
  name: string
  role: string
  description: string
  discordId: string
  fallbackColor: string
}

interface DiscordUserData {
  avatarUrl: string
  username: string
  avatarDecorationUrl?: string
}

export function AboutSection() {
  const stats = [
    { value: "25,500+", label: "Happy clients" },
    { value: "$15M", label: "Deals completed" },
    { value: "2023", label: "Established in" },
  ]

  const team: TeamMember[] = [
    {
      name: "Automised",
      role: "Founder & Lead Dev",
      description:
        "Built Automised Middleman from scratch in 2023. Oversees automation, backend upgrades, and new feature rollouts to keep deals running 24/7.",
      discordId: "1186494602040070286",
      fallbackColor: "bg-green-500",
    },
    {
      name: "Heat",
      role: "Security & Risk Analyst",
      description:
        "Handles scam prevention, investigates disputes, and ensures every transaction stays clean, transparent, and fast.",
      discordId: "1400839576326770688", // Update this with Heat's real Discord ID
      fallbackColor: "bg-pink-500",
    },
    {
      name: "Tyrel",
      role: "Bot Infrastructure & Uptime",
      description:
        "Maintains Automised's stability across all supported coins. Ensures the bot stays online, synced, and ready 24/7.",
      discordId: "907110319099359312", // Replace with Tyrel's real Discord ID
      fallbackColor: "bg-red-500",
    },
    {
      name: "Yacovy",
      role: "Head Support",
      description:
        "Fixes errors, resolves ticket issues, and ensures deals continue smoothly even when problems come up mid transaction.",
      discordId: "913057670808866846", // Replace with Yacovy's real Discord ID
      fallbackColor: "bg-blue-400",
    },
  ]
  // </CHANGE>

  const [userData, setUserData] = useState<Record<string, DiscordUserData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      const data: Record<string, DiscordUserData> = {}

      const promises = team.map(async (member) => {
        // Skip invalid placeholder IDs
        if (!member.discordId || !/^\d+$/.test(member.discordId)) {
          console.log(`[v0] Skipping invalid Discord ID for ${member.name}`)
          return
        }

        try {
          const response = await fetch(`/api/discord/avatar/${member.discordId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.avatarUrl && result.username) {
              data[member.discordId] = {
                avatarUrl: result.avatarUrl,
                username: result.username,
                avatarDecorationUrl: result.avatarDecorationUrl,
              }
            }
          } else {
            console.log(`[v0] Failed to fetch Discord data for ${member.name}:`, response.status)
          }
        } catch (error) {
          console.log(`[v0] Error fetching Discord data for ${member.name}:`, error)
        }
      })

      await Promise.all(promises)
      setUserData(data)
      setLoading(false)
    }

    fetchUserData()
  }, [])
  // </CHANGE>

  return (
    <section className="relative py-24 bg-background" id="about">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <span className="text-sm text-muted-foreground">About Us</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance mb-6">
              Facilitating secure deals since 2023.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Trusted by 25,500+ happy clients, with $15M+ in deals completed.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-6">
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {team.map((member, index) => {
              const hasValidDiscordId = /^\d+$/.test(member.discordId)
              const userInfo = userData[member.discordId]

              return (
                <div
                  key={index}
                  className="flex gap-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all hover:bg-card/80 hover:border-primary/50"
                >
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-visible">
                    <div className="h-full w-full rounded-full overflow-hidden">
                      {hasValidDiscordId && userInfo?.avatarUrl ? (
                        <img
                          src={userInfo.avatarUrl || "/placeholder.svg"}
                          alt={`${userInfo.username} avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className={`h-full w-full ${member.fallbackColor} flex items-center justify-center`}>
                          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.077.077 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {hasValidDiscordId && userInfo?.avatarDecorationUrl && (
                      <img
                        src={userInfo.avatarDecorationUrl || "/placeholder.svg"}
                        alt="Avatar decoration"
                        className="absolute inset-0 h-full w-full object-contain pointer-events-none z-10 scale-[1.3]"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {hasValidDiscordId && userInfo?.username ? userInfo.username : member.name}
                    </h3>
                    <p className="text-sm text-primary mb-2">{member.role}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{member.description}</p>
                  </div>
                </div>
              )
            })}
            {/* </CHANGE> */}
          </div>
        </div>
      </div>
    </section>
  )
}
