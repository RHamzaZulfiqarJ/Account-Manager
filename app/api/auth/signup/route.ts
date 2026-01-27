export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { signupSchema } from "@/libs/validation";
import { hashPassword } from "@/libs/password";
import { signToken } from "@/libs/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input" },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    const token = signToken({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    const response = NextResponse.json(
      { message: "Signup successful" },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 3, // 3 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
