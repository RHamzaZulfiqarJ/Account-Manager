export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { loginSchema } from "@/libs/validation";
import { verifyPassword } from "@/libs/password";
import { signToken } from "@/libs/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1️⃣ Validate input
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 2️⃣ Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3️⃣ Verify password
    const valid = await verifyPassword(password, user.password ?? "");

    if (!valid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4️⃣ Create JWT
    const token = signToken({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    // 5️⃣ Set cookie
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 3, // 3 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
