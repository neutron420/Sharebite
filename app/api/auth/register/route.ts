import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import { NotificationType, Prisma, UserRole } from "@/app/generated/prisma";
import { ZodError } from "zod";

async function registerHandler(request: Request) {
  try {
    const body = await request.json();
    const { turnstileToken, ...registerData } = body;
    const isProduction = process.env.NODE_ENV === "production";
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
    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: TURNSTILE_SECRET_KEY,
          response: normalizedTurnstileToken,
        }),
      });

      const verifyData = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok || !verifyData?.success) {
        return NextResponse.json({ error: "Security verification failed. Please refresh." }, { status: 403 });
      }
    } catch (turnstileError) {
      console.error("Turnstile verification error:", turnstileError);

      // Keep local development unblocked if Cloudflare verification is temporarily unavailable.
      if (isProduction) {
        return NextResponse.json(
          { error: "Security verification service unavailable. Please try again." },
          { status: 503 }
        );
      }
    }
    
    // 2. Validate input
    const validatedData = registerSchema.parse(registerData);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash password with high work factor
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // SECURITY NOTE: In production, you should wrap ADMIN registration behind an invite code or secret key.
    // For now, allowing direct ADMIN creation as requested for the /admin/register portal.
    const normalizedRole = String(validatedData.role || "").trim().toUpperCase();
    const assignedRole = UserRole[normalizedRole as keyof typeof UserRole];

    if (!assignedRole) {
      return NextResponse.json(
        {
          error:
            "Server role configuration is out of sync. Run `bunx prisma generate` and restart the dev server.",
        },
        { status: 503 }
      );
    }

    let selectedNgo: { id: string; name: string } | null = null;

    if (assignedRole === UserRole.RIDER) {
      if (!validatedData.riderNgoId) {
        return NextResponse.json(
          { error: "Please select an NGO before registering as a rider." },
          { status: 400 }
        );
      }

      const ngo = await prisma.user.findUnique({
        where: { id: validatedData.riderNgoId },
        select: {
          id: true,
          name: true,
          role: true,
          isVerified: true,
          isLicenseSuspended: true,
          suspensionExpiresAt: true,
        },
      });

      if (!ngo || ngo.role !== "NGO") {
        return NextResponse.json(
          { error: "Selected NGO is invalid. Please choose another NGO." },
          { status: 400 }
        );
      }

      const ngoTemporarilySuspended =
        !!ngo.suspensionExpiresAt && new Date(ngo.suspensionExpiresAt) > new Date();

      if (!ngo.isVerified || ngo.isLicenseSuspended || ngoTemporarilySuspended) {
        return NextResponse.json(
          { error: "Selected NGO is not currently eligible for rider onboarding." },
          { status: 400 }
        );
      }

      selectedNgo = { id: ngo.id, name: ngo.name };
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: assignedRole,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        district: validatedData.district,
        pincode: validatedData.pincode,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        imageUrl: validatedData.imageUrl,
        verificationDoc: validatedData.verificationDoc,
        donorType: validatedData.donorType,
      },

    });

    if (user.role === UserRole.NGO) {
      await prisma.ngoVerification.create({
        data: {
          ngoId: user.id,
          registrationCertUrl: user.verificationDoc || undefined,
          status: "PENDING",
        },
      });
    }

    if (user.role === UserRole.RIDER && selectedNgo) {
      await prisma.riderVerificationRequest.create({
        data: {
          riderId: user.id,
          ngoId: selectedNgo.id,
        },
      });

      await createNotification({
        userId: selectedNgo.id,
        type: "SYSTEM",
        title: "New Rider Verification Request",
        message: `Rider "${user.name}" has applied to join your NGO fleet. Please review and approve from your dashboard.`,
        link: "/ngo/riders",
      });
    }

    // NOTIFY ADMINS: Real-time registration alert
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      });

      const notificationData = admins.map(admin => ({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: "New Registration Alert",
        message: user.role === UserRole.RIDER && selectedNgo
          ? `New RIDER "${user.name}" applied under NGO "${selectedNgo.name}" from ${user.city || "an Unknown sector"}.`
          : `New ${user.role} "${user.name}" has joined the platform from ${user.city || "an Unknown sector"}.`,
        link: `/admin/users`
      }));

      await prisma.notification.createMany({ data: notificationData });

      // Trigger WebSocket relay
      await Promise.all(admins.map(admin =>
        fetch('http://localhost:8081/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: admin.id,
            notification: {
              type: "SYSTEM",
              title: "New Registration",
              message: `${user.name} just signed up!`,
              link: `/admin/users`,
              createdAt: new Date().toISOString()
            }
          })
        }).catch(() => {})
      ));
    } catch (e) {
      console.error("Failed to notify admins of new registration:", e);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    void password;

    return NextResponse.json(
      { 
        message: "User registered successfully", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "User already exists with this email" },
          { status: 400 }
        );
      }

      if (error.code === "P1001") {
        return NextResponse.json(
          { error: "Database is currently unreachable. Please try again." },
          { status: 503 }
        );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      if (
        error.message.includes("Invalid value for argument `role`") ||
        error.message.includes("Expected UserRole")
      ) {
        return NextResponse.json(
          {
            error:
              "Prisma client enum is out of sync with GROUND_ADMIN. Run `bunx prisma generate` and restart the dev server.",
          },
          { status: 503 }
        );
      }
    }

    if (
      error instanceof Error &&
      (error.message.includes("SASL") || error.message.includes("client password must be a string"))
    ) {
      return NextResponse.json(
        { error: "Database connection configuration issue. Please verify DATABASE_URL." },
        { status: 503 }
      );
    }

    console.error("Registration error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return   NextResponse.json(
      { error: process.env.NODE_ENV === "production" ? "Internal Server Error" : `Internal Server Error: ${message}` },
      { status: 500 }
    );
  }
}

export const POST = withSecurity(registerHandler, { limit: 50 }); // Higher allowance for dev testing
