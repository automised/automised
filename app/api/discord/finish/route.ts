import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";


function expectedState(guildId: string, secret: string) {
  const payload = `verify:${guildId}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `verify:${guildId}:${sig}`;
}

async function exchangeCodeForToken(code: string) {
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
    throw new Error(`token_exchange_failed:${r.status}:${txt}`);
  }

  return (await r.json()) as { access_token: string };
}

async function fetchDiscordUser(accessToken: string) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`fetch_user_failed:${r.status}:${txt}`);
  }

  return (await r.json()) as {
    id: string;
    username: string;
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
    throw new Error(`role_add_failed:${r.status}:${txt}`);
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

  // Optional state validation (recommended)
  const guildId = process.env.GUILD_ID;
  const stateSecret = process.env.STATE_SECRET;

  if (state && guildId && stateSecret) {
    const exp = expectedState(guildId, stateSecret);
    if (state !== exp) {
      return NextResponse.redirect(`${base}/verify?ok=0&reason=bad_state`);
    }
  }

  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchDiscordUser(token.access_token);

    await addVerifiedRole(user.id);

    // Redirect to success page + set a cookie your UI can read (non-httpOnly)
    const res = NextResponse.redirect(`${base}/verify?ok=1`);

    // Your v0 verify page reads this via document.cookie, so httpOnly MUST be false.
    res.cookies.set(
      "verified_user",
      encodeURIComponent(JSON.stringify({ name: user.global_name ?? user.username, id: user.id })),
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
    // Show a useful reason (shortened)
    const msg = typeof e?.message === "string" ? e.message : "failed";
    const short = msg.slice(0, 120);
    return NextResponse.redirect(`${base}/verify?ok=0&reason=${encodeURIComponent(short)}`);
  }
}
