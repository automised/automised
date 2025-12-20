import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function exchangeCode(code: string) {
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
    throw new Error(`token_exchange_failed ${r.status} ${txt}`);
  }

  return (await r.json()) as { access_token: string };
}

async function fetchDiscordUser(accessToken: string) {
  const r = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`fetch_user_failed ${r.status} ${txt}`);
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

  // 204 = success
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`role_add_failed ${r.status} ${txt}`);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = cookies();
  const expectedState = cookieStore.get("oauth_state")?.value;

  // Clear it either way
  cookieStore.set("oauth_state", "", { path: "/", maxAge: 0 });

  const base = `${url.protocol}//${url.host}`;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=state`);
  }

  try {
    const token = await exchangeCode(code);
    const user = await fetchDiscordUser(token.access_token);

    // Give role (user must already be in the server)
    await addVerifiedRole(user.id);

    // OPTIONAL: if you want your Verify UI to show the username,
    // your page is currently trying to read this cookie in the browser.
    // That means httpOnly MUST be false.
    cookieStore.set(
      "verified_user",
      encodeURIComponent(JSON.stringify({ name: user.global_name ?? user.username, id: user.id })),
      {
        httpOnly: false, // <-- needed for document.cookie (your current UI)
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 10 * 60,
      }
    );

    return NextResponse.redirect(`${base}/verify?ok=1`);
  } catch (e) {
    return NextResponse.redirect(`${base}/verify?ok=0&reason=failed`);
  }
}
