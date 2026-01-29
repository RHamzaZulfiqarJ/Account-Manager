export const runtime = "nodejs";

import { prisma } from "@/libs/prisma";
import { isTokenExpired, refreshTwitterToken } from "@/libs/twitter";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const posts = await prisma.scheduledPost.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: new Date() },
    },
    include: {
      socialAccount: true,
    },
  });

  for (const post of posts) {

    const locked = await prisma.scheduledPost.updateMany({
      where: {
        id: post.id,
        status: "pending",
      },
      data: {
        status: "processing",
        lastAttemptAt: new Date(),
      },
    });

    if (locked.count === 0) continue;

    try {

      let accessToken = post.socialAccount.accessToken;

      if (!post.socialAccount.refreshToken) {
        throw new Error("Missing refresh token");
      }

      if (isTokenExpired(post.socialAccount.expiresAt)) {
        const refreshed = await refreshTwitterToken(
          post.socialAccount.refreshToken!
        );

        accessToken = refreshed.access_token;

        await prisma.socialAccount.update({
          where: { id: post.socialAccount.id },
          data: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
          },
        });
      }

      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: post.content }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "posted",
          postedAt: new Date(),
        },
      });
    } catch (err: any) {
      if (post.retryCount < 3) {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "pending",
            retryCount: { increment: 1 },
          },
        });
      } else {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
            errorMessage: err.message,
          },
        });
      }
    }
  }

  return NextResponse.json({
    processed: posts.length,
  });
}
