import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { signToken, getCookieName } from "@/lib/auth";
import { cookies } from "next/headers";
import { withSecurity } from "@/lib/api-handler";
import { ZodError } from "zod";
import { createAuditLog } from "@/lib/audit";

const ADMIN_ROLE_LOCK_ACTION = "ADMIN_ROLE_LOCK";
const GROUND_ADMIN_ROLE_LOCK_ACTION = "GROUND_ADMIN_ROLE_LOCK";
const GROUND_ADMIN_LOGIN_ACTION = "GROUND_ADMIN_LOGIN";

async function loginHandler(request: Request) {
  console.log(">>> LOGIN ATTEMPT REACHED HANDLER");
  try {
    const body = await request.json();
    const { turnstileToken, ...loginData } = body;
    const normalizedTurnstileToken = typeof turnstileToken === "string"
      ? turnstileToken.replace(/[\u200B-\u200D\uFEFF]/g, "").trim()
      : "";

    if (!normalizedTurnstileToken) {
      return NextResponse.json({ error: "Security verification required." }, { status: 400 });
    }

    // 1. Mandatory Turnstile Check
    const TURNSTILE_SECRET_KEY = (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "0x4AAAAAACtsY-pmCM5GL9xHM5ivTIxV9jQ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: normalizedTurnstileToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "Security verification failed. Please refresh." }, { status: 403 });
    }
    
    // 2. Validate input
    const validatedData = loginSchema.parse(loginData);
    const requestedRole = validatedData.role;
    const normalizedRequestedRole = requestedRole === "GROUND_ADMIN" ? "ADMIN" : requestedRole;

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
    if (normalizedRequestedRole && user.role !== normalizedRequestedRole) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.role === "ADMIN") {
      if (requestedRole !== "ADMIN" && requestedRole !== "GROUND_ADMIN") {
        return NextResponse.json(
          { error: "Select either Admin or Ground Admin to continue." },
          { status: 400 }
        );
      }

      const laneEvents = await prisma.auditLog.findMany({
        where: {
          adminId: user.id,
          action: {
            in: [ADMIN_ROLE_LOCK_ACTION, GROUND_ADMIN_ROLE_LOCK_ACTION, GROUND_ADMIN_LOGIN_ACTION],
          },
        },
        select: {
          action: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

      const latestLaneAction = laneEvents.find((event) =>
        event.action === ADMIN_ROLE_LOCK_ACTION ||
        event.action === GROUND_ADMIN_ROLE_LOCK_ACTION ||
        event.action === GROUND_ADMIN_LOGIN_ACTION
      );

      const lockedLane =
        latestLaneAction?.action === ADMIN_ROLE_LOCK_ACTION
          ? "ADMIN"
          : latestLaneAction
            ? "GROUND_ADMIN"
            : null;

      if (lockedLane && requestedRole !== lockedLane) {
        const message =
          lockedLane === "GROUND_ADMIN"
            ? "This account is a Ground Admin account and cannot log in as normal Admin."
            : "This account is a normal Admin account and cannot log in as Ground Admin.";

        return NextResponse.json({ error: message }, { status: 403 });
      }

      if (!lockedLane) {
        try {
          await createAuditLog({
            adminId: user.id,
            action: requestedRole === "GROUND_ADMIN" ? GROUND_ADMIN_ROLE_LOCK_ACTION : ADMIN_ROLE_LOCK_ACTION,
            details:
              requestedRole === "GROUND_ADMIN"
                ? `Ground admin login lane locked for ${user.email}`
                : `Admin login lane locked for ${user.email}`,
          });
        } catch (auditError) {
          console.error("Admin lane lock audit log failed:", auditError);
          return NextResponse.json(
            { error: "Unable to establish account login lane. Please try again." },
            { status: 500 }
          );
        }
      }
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
    const cookieName = getCookieName(requestedRole || user.role);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    } as const;

    cookieStore.set(cookieName, token, cookieOptions);

    if (requestedRole === "GROUND_ADMIN" && user.role === "ADMIN") {
      try {
        await createAuditLog({
          adminId: user.id,
          action: GROUND_ADMIN_LOGIN_ACTION,
          details: `Ground admin session started for ${user.email}`,
        });
      } catch (auditError) {
        console.error("GROUND_ADMIN_LOGIN audit log failed:", auditError);
      }
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    void password;

    return NextResponse.json(
      { 
        message: "Login successful", 
        user: userWithoutPassword 
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
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
