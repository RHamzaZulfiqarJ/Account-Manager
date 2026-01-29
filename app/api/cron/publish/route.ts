export const runtime = "nodejs";

import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 1️⃣ Find due posts
  const posts = await prisma.scheduledPost.findMany({
    where: {
      status: "pending",
      scheduledAt: {
        lte: new Date(),
      },
    },
    include: {
      socialAccount: true,
    },
  });

  for (const post of posts) {

    // 2️⃣ Lock job (prevents double posting)
    const locked = await prisma.scheduledPost.updateMany({
      where: {
        id: post.id,
        status: "pending",
      },
      data: {
        status: "processing",
      },
    });

    if (locked.count === 0) continue;

    try {
      const account = post.socialAccount;

      if (account.platform !== "mastodon") {
        throw new Error("Unsupported platform");
      }

      const url = `${account.instanceUrl}/api/v1/statuses`;

      // 3️⃣ Post to Mastodon
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: post.content,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      // 4️⃣ Mark as posted
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "posted",
          postedAt: new Date(),
        },
      });

    } catch (err: any) {

      // 5️⃣ Mark as failed
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "failed",
          errorMessage: err.message,
        },
      });
    }
  }

  return NextResponse.json({
    processed: posts.length,
  });
}
