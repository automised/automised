import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"

/**
 * State format (static, works with a link button): verify:guildId:sig
 * where sig = HMAC_SHA256(STATE_SECRET, "verify:guildId")
 */
function expectedState(guildId: string, secret: string) {
  const payload = `verify:${guildId}`
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return `verify:${guildId}:${sig}`
}

function sign(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

async function exchangeCodeForToken(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID!
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!
  const redirectUri = process.env.DISCORD_REDIRECT_URI!

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    scope: "identify email guilds.join",
  })

  const r = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    console.error("Token exchange failed:", txt)
    throw new Error(`token_exchange_failed:${r.status}`)
  }

  const tokenData = await r.json()
  return {
    access_token: tokenData.access_token,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in,
    refresh_token: tokenData.refresh_token,
    scope: tokenData.scope,
  }
}

async function fetchDiscordUser(accessToken: string) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    console.error("Fetch user failed:", txt)
    throw new Error(`fetch_user_failed:${r.status}`)
  }

  return (await r.json()) as {
    id: string
    username: string
    discriminator?: string
    global_name?: string | null
    avatar?: string | null
    email?: string | null
    verified?: boolean
    locale?: string
    mfa_enabled?: boolean
    flags?: number
    premium_type?: number
    public_flags?: number
    banner?: string | null
    accent_color?: number | null
  }
}

async function addUserToServer(userId: string, accessToken: string) {
  const guildId = process.env.GUILD_ID!
  const botToken = process.env.DISCORD_BOT_TOKEN!

  // First, check if user is already in the server
  const memberCheck = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
  })

  if (memberCheck.status === 404) {
    // User not in server, add them using guilds.join scope
    console.log(`Adding user ${userId} to server...`)

    const addResponse = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    })

    if (!addResponse.ok) {
      const errorText = await addResponse.text().catch(() => "")
      console.error("Failed to add user to server:", errorText)
      // Don't throw error, just log it - user might need to join manually
    }
  } else if (!memberCheck.ok) {
    const errorText = await memberCheck.text().catch(() => "")
    console.error("Failed to check member status:", errorText)
  }
}

async function addVerifiedRole(userId: string) {
  const guildId = process.env.GUILD_ID!
  const roleId = process.env.VERIFY_ROLE_ID!
  const botToken = process.env.DISCORD_BOT_TOKEN!

  const r = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    // Common: 403 (bot perms/role hierarchy), 404 (user not in server / wrong IDs)
    console.error("Failed to add role:", txt)
    throw new Error(`role_add_failed:${r.status}`)
  }
}

// Helper function to get badges from flags
function getBadgesFromFlags(flags: number | undefined): string {
  if (!flags) return "None"

  const badgeNames: string[] = []

  // Define badge types without bitwise operators
  const badgeTypes: { [key: string]: string } = {
    "1": "STAFF",
    "2": "PARTNER",
    "4": "HYPESQUAD",
    "8": "BUG_HUNTER_LEVEL_1",
    "64": "HYPESQUAD_BRAVERY",
    "128": "HYPESQUAD_BRILLIANCE",
    "256": "HYPESQUAD_BALANCE",
    "512": "EARLY_SUPPORTER",
    "1024": "TEAM_USER",
    "16384": "BUG_HUNTER_LEVEL_2",
    "65536": "VERIFIED_BOT",
    "131072": "VERIFIED_DEVELOPER",
    "262144": "CERTIFIED_MODERATOR",
    "524288": "BOT_HTTP_INTERACTIONS",
    "4194304": "ACTIVE_DEVELOPER",
  }

  // Check each badge type
  for (const flagValue in badgeTypes) {
    const flagNum = Number.parseInt(flagValue, 10)
    if ((flags & flagNum) === flagNum) {
      badgeNames.push(badgeTypes[flagValue])
    }
  }

  return badgeNames.length > 0 ? badgeNames.join(", ") : "None"
}

// Helper function to get premium type name
function getPremiumType(type: number | undefined): string {
  switch (type) {
    case 1:
      return "Nitro Classic"
    case 2:
      return "Nitro"
    case 3:
      return "Nitro Basic"
    default:
      return "None"
  }
}

async function logToVps(req: Request, payload: any) {
  const url = process.env.VERIFY_LOG_URL
  const secret = process.env.VERIFY_LOG_SECRET
  if (!url || !secret) {
    console.log("Logging skipped: VERIFY_LOG_URL or VERIFY_LOG_SECRET not set")
    return
  }

  const body = JSON.stringify(payload)

  // Best-effort forward IP chain + UA
  const xff = req.headers.get("x-forwarded-for") ?? ""
  const ua = req.headers.get("user-agent") ?? ""
  const cfCountry = req.headers.get("cf-ipcountry") ?? "Unknown"
  const cfRegion = req.headers.get("cf-region") ?? "Unknown"

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": sign(body, secret),
        "X-Forwarded-For": xff,
        "User-Agent": ua,
      },
      body,
    })

    if (!response.ok) {
      console.error("Logging to VPS failed:", await response.text())
    }
  } catch (error) {
    console.error("Failed to send log to VPS:", error)
    // Don't fail verification if logging fails
  }
}

// Helper function to get Discord account creation date from user ID
function getDiscordAccountCreationDate(userId: string): string | null {
  try {
    // Discord's epoch: 2015-01-01 00:00:00 UTC
    const discordEpoch = 1420070400000

    // Convert user ID to BigInt
    const userIdBigInt = BigInt(userId)

    // Extract timestamp: (userId >> 22) + discordEpoch
    // Using division instead of bitwise shift
    const timestamp = Number(userIdBigInt / BigInt(4194304)) + discordEpoch

    return new Date(timestamp).toISOString()
  } catch (error) {
    console.error("Failed to calculate account creation date:", error)
    return null
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  const base = `${url.protocol}//${url.host}`

  if (!code) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=missing_code`)
  }

  // Validate state if configured
  const guildId = process.env.GUILD_ID
  const stateSecret = process.env.STATE_SECRET

  if (guildId && stateSecret) {
    const exp = expectedState(guildId, stateSecret)
    if (!state || state !== exp) {
      return NextResponse.redirect(`${base}/verify?ok=0&reason=bad_state`)
    }
  }

  try {
    const token = await exchangeCodeForToken(code)
    const user = await fetchDiscordUser(token.access_token)

    // ✅ Use the actual Discord username/handle
    const realUsername =
      user.global_name ||
      (user.discriminator && user.discriminator !== "0" ? `${user.username}#${user.discriminator}` : user.username)

    // Add user to server if not already a member (using guilds.join scope)
    await addUserToServer(user.id, token.access_token)

    // Give verified role
    await addVerifiedRole(user.id)

    // Get IP from request (Vercel specific)
    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Unknown"

    // Calculate account age from Discord ID snowflake
    const registeredAt = getDiscordAccountCreationDate(user.id)

    // Prepare enhanced payload with all Discord data
    const logPayload = {
      userId: user.id,
      username: realUsername,
      guildId: process.env.GUILD_ID!,
      verifiedAt: new Date().toISOString(),
      // Email & Contact
      email: user.email || null,
      emailVerified: user.verified || false,
      locale: user.locale || "Unknown",
      mfaEnabled: user.mfa_enabled || false,
      // Account age
      registeredAt: registeredAt,
      // Tech Details
      ip: ip,
      browser: req.headers.get("user-agent") || "Unknown",
      // Location (from Cloudflare headers if available)
      country: req.headers.get("cf-ipcountry") || "Unknown",
      region: req.headers.get("cf-region") || "Unknown",
      isp: "Unknown", // Can't get ISP from headers
      // Badges & Membership
      premiumType: getPremiumType(user.premium_type),
      badges: getBadgesFromFlags(user.public_flags || user.flags),
    }

    console.log("Logging payload:", JSON.stringify(logPayload, null, 2))

    // Log to your VPS (SQLite) with IP + user-agent
    await logToVps(req, logPayload)

    // Success redirect
    const res = NextResponse.redirect(`${base}/verify?ok=1`)

    // Your verify page reads document.cookie, so httpOnly MUST be false
    res.cookies.set(
      "verified_user",
      encodeURIComponent(
        JSON.stringify({
          name: realUsername,
          id: user.id,
          avatar: user.avatar,
          email: user.email,
          verified: user.verified,
        }),
      ),
      {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 10 * 60, // 10 minutes
      },
    )

    return res
  } catch (e: any) {
    console.error("Verification error:", e)
    const msg = typeof e?.message === "string" ? e.message : "failed"
    return NextResponse.redirect(`${base}/verify?ok=0&reason=${encodeURIComponent(msg)}`)
  }
}
