import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { signToken, getCookieName } from "@/lib/auth";
import { cookies } from "next/headers";
import { withSecurity } from "@/lib/api-handler";

async function loginHandler(request: Request) {
  try {
    const body = await request.json();
    const { turnstileToken, ...loginData } = body;

    // 1. Mandatory Turnstile Check
    const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "Security verification failed. Please refresh." }, { status: 403 });
    }
    
    // 2. Validate input
    const validatedData = loginSchema.parse(loginData);

    // 3. Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // Explicit Role Enforcement (Optional but recommended for designated login pages)
    if (validatedData.role && user.role !== validatedData.role) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Block Suspended/Terminated Users (Apply to all roles except ADMIN for safety)
    if (user.role !== "ADMIN") {
      if (user.isLicenseSuspended) {
        return NextResponse.json(
          { error: "Your account has been permanently terminated due to critical violations." },
          { status: 403 }
        );
      }

      if (user.suspensionExpiresAt && new Date(user.suspensionExpiresAt) > new Date()) {
        const expiresAt = new Date(user.suspensionExpiresAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        return NextResponse.json(
          { error: `Your account is currently suspended until ${expiresAt} due to platform violations.` },
          { status: 403 }
        );
      }
    }

    // Create session token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Keep the generic and role cookie aligned so shared APIs resolve the active user reliably.
    const cookieStore = await cookies();
    const cookieName = getCookieName(user.role);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    } as const;

    cookieStore.set(cookieName, token, cookieOptions);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "Login successful", 
        user: userWithoutPassword 
      },
      { status: 200 }
    );

  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withSecurity(loginHandler, { limit: 50, window: 60 }); // Relaxed for development testing
