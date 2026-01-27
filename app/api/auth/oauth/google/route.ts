export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: "http://localhost:3000/api/auth/oauth/google/callback",
    response_type: "code",
    scope: "email profile",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
