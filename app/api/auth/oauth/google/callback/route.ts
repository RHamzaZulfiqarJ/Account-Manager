export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { signToken } from "@/libs/jwt";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const baseURL = process.env.NEXT_PUBLIC_APP_URL;

  const tokenRes = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:
          `${baseURL}/api/auth/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    }
  );

  const tokenData = await tokenRes.json();

  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );

  const profile = await userRes.json();

  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: profile.given_name,
        lastName: profile.family_name,
        email: profile.email,
        provider: "google",
        providerId: profile.id,
      },
    });
  }

  const jwt = signToken({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const response = NextResponse.redirect(
    new URL("/dashboard", req.url)
  );

  response.cookies.set("token", jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
