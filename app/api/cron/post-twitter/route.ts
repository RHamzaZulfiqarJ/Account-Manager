export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import axios from "axios";

export async function GET(req: Request) {
  try {
    /* ---------------------------------
       1️⃣ Secure cron
    --------------------------------- */
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    /* ---------------------------------
       2️⃣ Fetch pending posts
    --------------------------------- */
    const posts = await prisma.scheduledPost.findMany({
      where: {
        status: "pending",
        scheduledAt: {
          lte: new Date(),
        },
        platform: "twitter",
      },
      include: {
        socialAccount: true,
      },
    });

    /* ---------------------------------
       3️⃣ Publish each post
    --------------------------------- */
    for (const post of posts) {
      try {
        await axios.post(
          "https://api.twitter.com/2/tweets",
          { text: post.content },
          {
            headers: {
              Authorization: `Bearer ${post.socialAccount.accessToken}`,
            },
          }
        );

        // ✅ success
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "posted",
            postedAt: new Date(),
          },
        });

      } catch (err: any) {
        // ❌ failure
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: "failed",
            errorMessage:
              err.response?.data?.detail ||
              err.message ||
              "Twitter post failed",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: posts.length,
    });

  } catch (error) {
    console.error("CRON ERROR:", error);
    return NextResponse.json(
      { error: "Scheduler failed" },
      { status: 500 }
    );
  }
}
