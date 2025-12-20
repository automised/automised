import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";

function makeState() {
  return crypto.randomBytes(24).toString("hex");
}

export async function GET(req: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse("Missing DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI", { status: 500 });
  }

  const state = makeState();

  // Save state in a cookie so we can validate the callback (basic CSRF protection)
  cookies().set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri, // https://v0-automised.vercel.app/callback
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });

  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
