export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { verifyToken } from "@/libs/jwt";

export async function POST(req: Request) {
  try {
    /* -----------------------------------
       1️⃣ Authenticate user
    ----------------------------------- */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    /* -----------------------------------
       2️⃣ Read body
    ----------------------------------- */
    const body = await req.json();
    const { content, scheduledAt, accountIds } = body;

    if (!content || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    /* -----------------------------------
       3️⃣ Fetch & validate accounts
    ----------------------------------- */
    const accounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: accountIds },
        userId: payload.id,
      },
    });

    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        { error: "One or more accounts invalid" },
        { status: 403 }
      );
    }

    /* -----------------------------------
       4️⃣ Create scheduled jobs
    ----------------------------------- */
    const now = new Date();

    const postsData = accounts.map((account) => ({
      content,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : now,
      status: "pending",
      socialAccountId: account.id,
    }));

    await prisma.scheduledPost.createMany({
      data: postsData,
    });

    return NextResponse.json({
      success: true,
      created: postsData.length,
    });

  } catch (error) {
    console.error("CREATE POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create posts" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    const posts = await prisma.scheduledPost.findMany({
      where: {
        socialAccount: {
          userId: payload.id,
        },
      },
      include: {
        socialAccount: {
          select: {
            accountUsername: true,
            platform: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
