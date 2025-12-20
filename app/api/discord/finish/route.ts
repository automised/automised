import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";

function hmacHex(secret: string, data: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function parseAndVerifyState(state: string) {
  // expected: verify:<guildId>:<userId>:<ts>:<sig>
  const parts = state.split(":");
  if (parts.length !== 5) return null;

  const [prefix, guildId, userId, tsStr, sig] = parts;
  if (prefix !== "verify") return null;

  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return null;

  // 10 minute expiry
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age < 0 || age > 10 * 60) return null;

  const secret = process.env.STATE_SECRET;
  if (!secret) return null;

  const payload = `verify:${guildId}:${userId}:${ts}`;
  const expected = hmacHex(secret, payload);

  if (!timingSafeEqual(expected, sig)) return null;

  return { guildId, userId };
}

async function exchangeCode(code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = process.env.DISCORD_REDIRECT_URI!;

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
    throw new Error(`token_exchange_failed ${r.status} ${txt}`);
  }
  return (await r.json()) as { access_token: string };
}

async function fetchUser(accessToken: string) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`fetch_user_failed ${r.status} ${txt}`);
  }
  return (await r.json()) as { id: string; username: string; global_name?: string | null };
}

async function addVerifiedRole(userId: string) {
  const guildId = process.env.GUILD_ID!;
  const roleId = process.env.VERIFY_ROLE_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;

  const r = await fetch(
    `https://discord.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method: "PUT", headers: { Authorization: `Bot ${botToken}` } }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`role_add_failed ${r.status} ${txt}`);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const base = `${url.protocol}//${url.host}`;

  if (!code || !state) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=missing_code_or_state`);
  }

  const parsed = parseAndVerifyState(state);
  if (!parsed) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=bad_state`);
  }

  // Lock to your server only
  if (parsed.guildId !== process.env.GUILD_ID) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=wrong_guild`);
  }

  try {
    const token = await exchangeCode(code);
    const user = await fetchUser(token.access_token);

    // Must match the userId inside the signed state
    if (user.id !== parsed.userId) {
      return NextResponse.redirect(`${base}/verify?ok=0&reason=user_mismatch`);
    }

    await addVerifiedRole(user.id);

    // Your current Verify page reads this in the browser, so httpOnly must be false
    cookies().set(
      "verified_user",
      encodeURIComponent(JSON.stringify({ name: user.global_name ?? user.username, id: user.id })),
      { httpOnly: false, sameSite: "lax", secure: true, path: "/", maxAge: 10 * 60 }
    );

    return NextResponse.redirect(`${base}/verify?ok=1`);
  } catch {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=failed`);
  }
}
