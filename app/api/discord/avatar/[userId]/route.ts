import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.log("[v0] DISCORD_BOT_TOKEN not configured")
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    if (params.userId === "YOUR_DISCORD_ID_HERE" || !/^\d+$/.test(params.userId)) {
      console.log("[v0] Invalid Discord ID:", params.userId)
      return NextResponse.json({ error: "Invalid Discord ID" }, { status: 400 })
    }

    const response = await fetch(`https://discord.com/api/v10/users/${params.userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.log("[v0] Discord API error:", response.status)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: response.status })
    }

    const user = await response.json()
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${params.userId}/${user.avatar}.${
          user.avatar.startsWith("a_") ? "gif" : "png"
        }?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number.parseInt(user.discriminator) % 5}.png`

    const avatarDecorationUrl = user.avatar_decoration_data?.asset
      ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128`
      : undefined

    return NextResponse.json({
      avatarUrl,
      username: user.username,
      avatarDecorationUrl,
    })
    // </CHANGE>
  } catch (error) {
    console.log("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
