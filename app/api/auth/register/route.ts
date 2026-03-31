import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { withSecurity } from "@/lib/api-handler";

async function registerHandler(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);

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
        message: `New ${user.role} "${user.name}" has joined the platform from ${user.city || 'an Unknown sector'}.`,
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
