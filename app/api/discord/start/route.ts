import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse("Missing DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI", { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri, // https://v0-automised.vercel.app/callback
    response_type: "code",
    scope: "identify",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
