export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";
import { verifyToken } from "@/libs/jwt";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { accounts: [] },
      { status: 401 }
    );
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json(
      { accounts: [] },
      { status: 401 }
    );
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: payload.id },
    select: {
      id: true,
      platform: true,
      accountUsername: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts });
}
