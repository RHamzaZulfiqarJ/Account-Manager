export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { signToken } from "@/libs/jwt";

type GoogleProfile = {
    id?: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
};

const redirectToLogin = (req: Request, error: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", error);

    return NextResponse.redirect(url);
};

const getNames = (profile: GoogleProfile) => {
    const fallbackName = profile.name || profile.email?.split("@")[0] || "Google User";
    const parts = fallbackName.trim().split(/\s+/);

    return {
        firstName: profile.given_name || parts[0] || "Google",
        lastName: profile.family_name || parts.slice(1).join(" ") || "",
    };
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const baseURL = process.env.NEXT_PUBLIC_APP_URL;

        if (!code) {
            return redirectToLogin(req, "Missing Google authorization code");
        }

        if (!baseURL || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return redirectToLogin(req, "Google OAuth is not configured");
        }

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${baseURL}/api/auth/oauth/google/callback`,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error("GOOGLE TOKEN ERROR:", errorText);

            return redirectToLogin(req, "Google token exchange failed");
        }

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return redirectToLogin(req, "Google access token missing");
        }

        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userRes.ok) {
            const errorText = await userRes.text();
            console.error("GOOGLE PROFILE ERROR:", errorText);

            return redirectToLogin(req, "Google profile fetch failed");
        }

        const profile = (await userRes.json()) as GoogleProfile;

        if (!profile.email || !profile.id) {
            return redirectToLogin(req, "Google profile is incomplete");
        }

        const names = getNames(profile);

        const user = await prisma.user.upsert({
            where: {
                email: profile.email,
            },
            update: {
                provider: "google",
                providerId: profile.id,
            },
            create: {
                firstName: names.firstName,
                lastName: names.lastName,
                email: profile.email,
                provider: "google",
                providerId: profile.id,
            },
        });

        const jwt = signToken({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        });

        const response = NextResponse.redirect(new URL("/dashboard", baseURL));

        response.cookies.set("token", jwt, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error("GOOGLE OAUTH CALLBACK ERROR:", error);

        return redirectToLogin(req, "Google login failed");
    }
}
