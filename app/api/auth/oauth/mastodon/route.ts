export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  const instance = process.env.MASTODON_INSTANCE!;
  const redirectUri =
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/mastodon/callback`;

  const authUrl =
    `${instance}/oauth/authorize?` +
    new URLSearchParams({
      client_id: process.env.MASTODON_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read write profile",
    }).toString();

  return NextResponse.redirect(authUrl);
}
