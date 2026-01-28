import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { verifyToken } from "@/libs/jwt";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code received" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("twitter_oauth_verifier")?.value;

  if (!codeVerifier) {
    return NextResponse.json(
      { error: "Missing code verifier" },
      { status: 400 }
    );
  }

  try {
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/twitter/callback`,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
    } = tokenResponse.data;

    const profileRes = await axios.get(
      "https://api.twitter.com/2/users/me",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const twitterUser = profileRes.data.data;

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const userId = payload.id;

  const existingAccount = await prisma.socialAccount.findFirst({
    where: {
        platform: "twitter",
        accountId: twitterUser.id,
      },
    });

    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
        },
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          platform: "twitter",
          accountId: twitterUser.id,
          accountUsername: twitterUser.username,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          userId,
        },
      });
    }


    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/`
    );

  } catch (error: any) {
    console.error("FULL ERROR:", error);
    console.error("ERROR KEYS:", Object.keys(error || {}));

    return NextResponse.json(
      { error: "OAuth token exchange failed" },
      { status: 500 }
    );
  }
}
