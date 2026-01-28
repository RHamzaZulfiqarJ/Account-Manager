export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { verifyToken } from "@/libs/jwt";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    /* -------------------------------
       1️⃣ Extract route param
    -------------------------------- */
    const { id } = await context.params;

    /* -------------------------------
       2️⃣ Read JWT cookie
    -------------------------------- */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* -------------------------------
       3️⃣ Verify token
    -------------------------------- */
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    /* -------------------------------
       4️⃣ Ownership check
    -------------------------------- */
    const account = await prisma.socialAccount.findFirst({
      where: {
        id,
        userId: payload.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    /* -------------------------------
       5️⃣ Delete account
    -------------------------------- */
    await prisma.socialAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
