export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { verifyToken } from "@/libs/jwt";

export async function POST(req: Request) {
  try {
    /* ----------------------------------
       1️⃣ Authenticate user
    ---------------------------------- */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    /* ----------------------------------
       2️⃣ Read request body
    ---------------------------------- */
    const body = await req.json();
    const { content, socialAccountId, scheduledAt } = body;

    if (!content || !socialAccountId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    console.log("JWT USER ID:", payload.id);
    console.log("REQUEST BODY:", socialAccountId);
    /* ----------------------------------
       3️⃣ Validate account ownership
    ---------------------------------- */
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: socialAccountId,
        userId: payload.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Invalid social account" },
        { status: 403 }
      );
    }

    /* ----------------------------------
       4️⃣ Create scheduled post
    ---------------------------------- */
    await prisma.scheduledPost.create({
      data: {
        content,
        platform: account.platform,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt)
          : new Date(),
        status: "pending",
        socialAccountId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("CREATE POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
