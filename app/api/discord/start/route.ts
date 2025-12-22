import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const guildId = process.env.GUILD_ID;
  const stateSecret = process.env.STATE_SECRET;

  if (!clientId || !redirectUri) {
    return new NextResponse("Missing DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI", { status: 500 });
  }

  // Create state for CSRF protection
  let state = "";
  if (guildId && stateSecret) {
    const crypto = await import("crypto");
    const payload = `verify:${guildId}`;
    const sig = crypto.createHmac("sha256", stateSecret).update(payload).digest("hex");
    state = `verify:${guildId}:${sig}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email guilds.join",
    prompt: "consent",
  });

  // Add state if we have it
  if (state) {
    params.append("state", state);
  }

  // Add warning about VPN blocking
  params.append("disable_guess", "true"); // Optional: disable Discord's guess UI
  
  // Instead of immediate redirect, you could show a warning page first
  // But for simplicity, we'll redirect directly
  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
