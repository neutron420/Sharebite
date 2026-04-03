import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";

async function registerHandler(request: Request) {
  try {
    const body = await request.json();
    const { turnstileToken, ...registerData } = body;

    // 1. Mandatory Turnstile Check
    const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "0x4AAAAAACtsY-pmCM5GL9xHM5ivTIxV9jQ";
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
    let assignedRole = validatedData.role;
    let selectedNgo: { id: string; name: string } | null = null;

    if (assignedRole === "RIDER") {
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
        donorType: (validatedData as any).donorType,
      },

    });

    if (user.role === "RIDER" && selectedNgo) {
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
        type: "SYSTEM" as any,
        title: "New Registration Alert",
        message: user.role === "RIDER" && selectedNgo
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
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "User registered successfully", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return   NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withSecurity(registerHandler, { limit: 50 }); // Higher allowance for dev testing
