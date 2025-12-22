import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * State format (static, works with a link button):
 *   verify:<guildId>:<sig>
 * where sig = HMAC_SHA256(STATE_SECRET, "verify:<guildId>")
 */
function expectedState(guildId: string, secret: string) {
  const payload = `verify:${guildId}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `verify:${guildId}:${sig}`;
}

function sign(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

// New function to check if IP is VPN/Proxy
async function checkVPN(ip: string): Promise<{ isVPN: boolean; vpnInfo?: any }> {
  if (!ip || ip === "Unknown" || ip === "127.0.0.1") {
    return { isVPN: false };
  }

  try {
    // Use ip-api.com for VPN detection (free, no API key needed)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,isp,org,lat,lon,as,query,proxy,hosting`,
      { timeout: 3000 }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        // Check for VPN/Proxy/Hosting
        const isVPN = data.proxy === true || data.hosting === true;
        
        if (isVPN) {
          return {
            isVPN: true,
            vpnInfo: {
              service: data.proxy ? "Proxy/VPN" : data.hosting ? "Hosting/Datacenter" : "Unknown",
              confidence: data.proxy || data.hosting ? 70 : 0,
              ipType: data.proxy ? "vpn" : data.hosting ? "hosting" : "residential",
              asn: data.org || "Unknown",
              isp: data.isp || "Unknown",
              country: data.country || "Unknown",
              city: data.city || "Unknown"
            }
          };
        }
      }
    }
  } catch (error) {
    console.error("VPN check error:", error);
    // If VPN check fails, allow the user (fail open, not closed)
    // Change this to { isVPN: true } if you want to block when VPN check fails
  }

  return { isVPN: false };
}

async function exchangeCodeForToken(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = process.env.DISCORD_REDIRECT_URI!;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    scope: "identify email guilds.join",
  });

  const r = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("Token exchange failed:", txt);
    throw new Error(`token_exchange_failed:${r.status}`);
  }

  const tokenData = await r.json();
  return {
    access_token: tokenData.access_token,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in,
    refresh_token: tokenData.refresh_token,
    scope: tokenData.scope,
  };
}

async function fetchDiscordUser(accessToken: string) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    console.error("Fetch user failed:", txt);
    throw new Error(`fetch_user_failed:${r.status}`);
  }

  return (await r.json()) as {
    id: string;
    username: string;
    discriminator?: string;
    global_name?: string | null;
    avatar?: string | null;
    email?: string | null;
    verified?: boolean;
    locale?: string;
    mfa_enabled?: boolean;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
    banner?: string | null;
    accent_color?: number | null;
  };
}

async function addUserToServer(userId: string, accessToken: string) {
  const guildId = process.env.GUILD_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;

  // First, check if user is already in the server
  const memberCheck = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${userId}`,
    {
      headers: { 
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
    }
  );

  if (memberCheck.status === 404) {
    // User not in server, add them using guilds.join scope
    console.log(`Adding user ${userId} to server...`);
    
    const addResponse = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${userId}`,
      {
        method: "PUT",
        headers: { 
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      }
    );

    if (!addResponse.ok) {
      const errorText = await addResponse.text().catch(() => "");
      console.error("Failed to add user to server:", errorText);
      // Don't throw error, just log it - user might need to join manually
    }
  } else if (!memberCheck.ok) {
    const errorText = await memberCheck.text().catch(() => "");
    console.error("Failed to check member status:", errorText);
  }
}

async function addVerifiedRole(userId: string) {
  const guildId = process.env.GUILD_ID!;
  const roleId = process.env.VERIFY_ROLE_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;

  const r = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: { 
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
    }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    // Common: 403 (bot perms/role hierarchy), 404 (user not in server / wrong IDs)
    console.error("Failed to add role:", txt);
    throw new Error(`role_add_failed:${r.status}`);
  }
}

// Helper function to get badges from flags
function getBadgesFromFlags(flags: number | undefined): string {
  if (!flags) return "None";
  
  const badgeNames: string[] = [];
  
  // Define badge types
  const badgeTypes = [
    { value: 1, name: "STAFF" },
    { value: 2, name: "PARTNER" },
    { value: 4, name: "HYPESQUAD" },
    { value: 8, name: "BUG_HUNTER_LEVEL_1" },
    { value: 64, name: "HYPESQUAD_BRAVERY" },
    { value: 128, name: "HYPESQUAD_BRILLIANCE" },
    { value: 256, name: "HYPESQUAD_BALANCE" },
    { value: 512, name: "EARLY_SUPPORTER" },
    { value: 1024, name: "TEAM_USER" },
    { value: 16384, name: "BUG_HUNTER_LEVEL_2" },
    { value: 65536, name: "VERIFIED_BOT" },
    { value: 131072, name: "VERIFIED_DEVELOPER" },
    { value: 262144, name: "CERTIFIED_MODERATOR" },
    { value: 524288, name: "BOT_HTTP_INTERACTIONS" },
    { value: 4194304, name: "ACTIVE_DEVELOPER" },
  ];

  // Check each badge type
  for (const badge of badgeTypes) {
    if ((flags & badge.value) === badge.value) {
      badgeNames.push(badge.name);
    }
  }

  return badgeNames.length > 0 ? badgeNames.join(", ") : "None";
}

// Helper function to get premium type name
function getPremiumType(type: number | undefined): string {
  switch (type) {
    case 1: return "Nitro Classic";
    case 2: return "Nitro";
    case 3: return "Nitro Basic";
    default: return "None";
  }
}

// Helper function to get Discord account creation date from user ID
function getDiscordAccountCreationDate(userId: string): string | null {
  try {
    // Discord's epoch: 2015-01-01 00:00:00 UTC
    const discordEpoch = 1420070400000;
    
    // Convert user ID to BigInt
    const userIdBigInt = BigInt(userId);
    
    // Extract timestamp: (userId >> 22) + discordEpoch
    const timestamp = Number(userIdBigInt / BigInt(4194304)) + discordEpoch;
    
    const date = new Date(timestamp);
    return date.toISOString();
  } catch (error) {
    console.error("Failed to calculate account creation date:", error);
    return null;
  }
}

async function logToVps(req: Request, payload: any) {
  const url = process.env.VERIFY_LOG_URL;
  const secret = process.env.VERIFY_LOG_SECRET;
  if (!url || !secret) {
    console.log("Logging skipped: VERIFY_LOG_URL or VERIFY_LOG_SECRET not set");
    return;
  }

  const body = JSON.stringify(payload);

  // Best-effort forward IP chain + UA
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ua = req.headers.get("user-agent") ?? "";
  const cfCountry = req.headers.get("cf-ipcountry") ?? "Unknown";
  const cfRegion = req.headers.get("cf-region") ?? "Unknown";

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
    });

    if (!response.ok) {
      console.error("Logging to VPS failed:", await response.text());
    }
  } catch (error) {
    console.error("Failed to send log to VPS:", error);
    // Don't fail verification if logging fails
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const base = `${url.protocol}//${url.host}`;

  if (!code) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=missing_code`);
  }

  // Validate state if configured
  const guildId = process.env.GUILD_ID;
  const stateSecret = process.env.STATE_SECRET;

  if (guildId && stateSecret) {
    const exp = expectedState(guildId, stateSecret);
    if (!state || state !== exp) {
      return NextResponse.redirect(`${base}/verify?ok=0&reason=bad_state`);
    }
  }

  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchDiscordUser(token.access_token);

    // Get IP from request
    const ip = req.headers.get('x-real-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               "Unknown";

    // 🔴 VPN CHECK - Block before proceeding further
    const vpnCheck = await checkVPN(ip);
    if (vpnCheck.isVPN) {
      console.log(`VPN detected for user ${user.id}:`, vpnCheck.vpnInfo);
      
      // Log the blocked attempt to VPS
      const blockedPayload = {
        userId: user.id,
        username: user.username,
        guildId: process.env.GUILD_ID!,
        verifiedAt: new Date().toISOString(),
        ok: false,
        reason: "VPN/Proxy blocked",
        email: user.email || null,
        emailVerified: user.verified || false,
        locale: user.locale || "Unknown",
        mfaEnabled: user.mfa_enabled || false,
        registeredAt: getDiscordAccountCreationDate(user.id),
        ip: ip,
        browser: req.headers.get("user-agent") || "Unknown",
        country: vpnCheck.vpnInfo?.country || "Unknown",
        region: req.headers.get("cf-region") || "Unknown",
        isp: vpnCheck.vpnInfo?.isp || "Unknown",
        premiumType: getPremiumType(user.premium_type),
        badges: getBadgesFromFlags(user.public_flags || user.flags),
        vpnDetected: true,
        vpnInfo: vpnCheck.vpnInfo
      };

      // Send blocked attempt to VPS for logging
      await logToVps(req, blockedPayload);

      // Redirect to error page with VPN info
      const errorParams = new URLSearchParams({
        ok: "0",
        reason: "vpn_detected",
        service: vpnCheck.vpnInfo?.service || "VPN/Proxy",
        ip: ip,
        country: vpnCheck.vpnInfo?.country || "Unknown"
      });

      return NextResponse.redirect(`${base}/verify?${errorParams.toString()}`);
    }

    // ✅ User passed VPN check, continue with verification
    
    // Use the actual Discord username
    const realUsername = user.discriminator && user.discriminator !== "0"
      ? `${user.username}#${user.discriminator}`
      : user.username;

    // Add user to server if not already a member
    await addUserToServer(user.id, token.access_token);

    // Give verified role
    await addVerifiedRole(user.id);

    // Calculate account age from Discord ID snowflake
    const accountAge = getDiscordAccountCreationDate(user.id);

    // Prepare enhanced payload with all Discord data
    const logPayload = {
      userId: user.id,
      username: realUsername,
      guildId: process.env.GUILD_ID!,
      verifiedAt: new Date().toISOString(),
      ok: true,
      reason: "Success",
      // Email & Contact
      email: user.email || null,
      emailVerified: user.verified || false,
      locale: user.locale || "Unknown",
      mfaEnabled: user.mfa_enabled || false,
      // Account age
      registeredAt: accountAge,
      // Tech Details
      ip: ip,
      browser: req.headers.get("user-agent") || "Unknown",
      // Location
      country: req.headers.get("cf-ipcountry") || "Unknown",
      region: req.headers.get("cf-region") || "Unknown",
      isp: "Unknown",
      // Badges & Membership
      premiumType: getPremiumType(user.premium_type),
      badges: getBadgesFromFlags(user.public_flags || user.flags),
      // VPN status
      vpnDetected: false,
      vpnInfo: null
    };

    console.log("Logging successful verification:", JSON.stringify(logPayload, null, 2));

    // Log to your VPS (SQLite) with IP + user-agent
    await logToVps(req, logPayload);

    // Success redirect
    const res = NextResponse.redirect(`${base}/verify?ok=1`);

    // Set verified user cookie
    res.cookies.set(
      "verified_user",
      encodeURIComponent(JSON.stringify({ 
        name: realUsername, 
        id: user.id,
        avatar: user.avatar,
        email: user.email,
        verified: user.verified,
        discriminator: user.discriminator,
        username: user.username,
        global_name: user.global_name
      })),
      {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 10 * 60, // 10 minutes
      }
    );

    return res;
  } catch (e: any) {
    console.error("Verification error:", e);
    const msg = typeof e?.message === "string" ? e.message : "failed";
    return NextResponse.redirect(`${base}/verify?ok=0&reason=${encodeURIComponent(msg)}`);
  }
}
