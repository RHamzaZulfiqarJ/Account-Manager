export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { verifyToken } from "@/libs/jwt";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // 🔐 verify logged-in user
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    const payload = verifyToken(token);

    const instance = process.env.MASTODON_INSTANCE!;

    /* -------------------------------------
       1️⃣ Exchange code for access token
    ------------------------------------- */
    const tokenRes = await fetch(`${instance}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.MASTODON_CLIENT_ID!,
        client_secret: process.env.MASTODON_CLIENT_SECRET!,
        redirect_uri:
          `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/mastodon/callback`,
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: tokenData },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    /* -------------------------------------
       2️⃣ Fetch user profile
    ------------------------------------- */
    const profileRes = await fetch(
      `${instance}/api/v1/accounts/verify_credentials`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profile = await profileRes.json();

    /* -------------------------------------
       3️⃣ Save account
    ------------------------------------- */
    await prisma.socialAccount.upsert({
      where: {
        platform_accountId: {
          platform: "mastodon",
          accountId: profile.id,
        },
      },
      update: {
        accessToken,
      },
      create: {
        platform: "mastodon",
        accountId: profile.id,
        accountUsername: profile.username,
        accessToken,
        instanceUrl: instance,
        userId: payload.id,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  } catch (err) {
    console.error("MASTODON CALLBACK ERROR:", err);
    return NextResponse.redirect(
      new URL("/dashboard?error=mastodon", req.url)
    );
  }
}
