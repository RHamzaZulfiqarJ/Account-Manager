export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/libs/jwt";
import { prisma } from "@/libs/prisma";

export async function GET() {

  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }

  try {
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }
}