import axios from "axios";
import qs from "qs";

export async function refreshTwitterToken(
  refreshToken: string
) {
  const basicAuth = Buffer.from(
    `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    "https://api.twitter.com/2/oauth2/token",
    qs.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export function isTokenExpired(expiresAt: Date | null) {
  if (!expiresAt) return true;
  return new Date() >= new Date(expiresAt);
}