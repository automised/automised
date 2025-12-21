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

async function exchangeCodeForToken(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = process.env.DISCORD_REDIRECT_URI!; // https://v0-automised.vercel.app/callback

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const r = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`token_exchange_failed:${r.status}`);
  }

  return (await r.json()) as { access_token: string };
}

async function fetchDiscordUser(accessToken: string) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`fetch_user_failed:${r.status}`);
  }

  return (await r.json()) as {
    id: string;
    username: string;
    discriminator?: string;
    global_name?: string | null;
  };
}

async function addVerifiedRole(userId: string) {
  const guildId = process.env.GUILD_ID!;
  const roleId = process.env.VERIFY_ROLE_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;

  const r = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: { Authorization: `Bot ${botToken}` },
    }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    // Common: 403 (bot perms/role hierarchy), 404 (user not in server / wrong IDs)
    throw new Error(`role_add_failed:${r.status}`);
  }
}

async function logToVps(req: Request, payload: any) {
  const url = process.env.VERIFY_LOG_URL;
  const secret = process.env.VERIFY_LOG_SECRET;
  if (!url || !secret) return; // optional

  const body = JSON.stringify(payload);

  // Best-effort forward IP chain + UA
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ua = req.headers.get("user-agent") ?? "";

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": sign(body, secret),
      "X-Forwarded-For": xff,
      "User-Agent": ua,
    },
    body,
  }).catch(() => {
    // Don't fail verification if logging fails
  });
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

    // ✅ Use the actual Discord username/handle
    const realUsername =
      user.discriminator && user.discriminator !== "0"
        ? `${user.username}#${user.discriminator}`
        : user.username;

    // Give role (user must already be in the server)
    await addVerifiedRole(user.id);

    // Log to your VPS (SQLite) with IP + user-agent
    await logToVps(req, {
      userId: user.id,
      username: realUsername,
      guildId: process.env.GUILD_ID!,
      verifiedAt: new Date().toISOString(),
    });

    // Success redirect
    const res = NextResponse.redirect(`${base}/verify?ok=1`);

    // Your verify page reads document.cookie, so httpOnly MUST be false
    res.cookies.set(
      "verified_user",
      encodeURIComponent(JSON.stringify({ name: realUsername, id: user.id })),
      {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 10 * 60,
      }
    );

    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "failed";
    return NextResponse.redirect(`${base}/verify?ok=0&reason=${encodeURIComponent(msg)}`);
  }
}
