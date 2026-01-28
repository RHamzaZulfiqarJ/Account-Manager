import { NextResponse } from "next/server";
import { generateCodeVerifier, generateCodeChallenge } from "@/libs/pkce";

export async function GET() {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const response = NextResponse.redirect(
    "https://twitter.com/i/oauth2/authorize?" +
      new URLSearchParams({
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/twitter/callback`,
        response_type: "code",
        scope: "tweet.read tweet.write users.read offline.access",
        state: crypto.randomUUID(),
        code_challenge: challenge,
        code_challenge_method: "S256",
      })
  );

  // store verifier in cookie
  response.cookies.set("twitter_oauth_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
