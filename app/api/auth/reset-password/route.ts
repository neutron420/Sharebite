import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import bcrypt from "bcryptjs";
import { withSecurity } from "@/lib/api-handler";

async function resetPasswordHandler(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // SECURITY: Ensure inputs are strict strings to block injection
    if (typeof email !== "string" || typeof otp !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Invalid data types provided." }, { status: 400 });
    }

    // 1. SECURE: Double verify OTP from Redis FIRST to prevent CPU-Exhaustion DoS from fake bcrypt requests
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      return NextResponse.json({ error: "Invalid or expired OTP. Please restart." }, { status: 401 });
    }

    // 2. Hash New Password (ONLY after we've verified authority)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 2. Update User in Prisma
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 3. Clear OTP from Redis
    await redis.del(`otp:${email}`);

    // Update session or audit log if admin
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.role === "ADMIN") {
        await prisma.auditLog.create({
          data: {
            action: "PASSWORD_RESET",
            details: `Admin password reset through OTP by ${email}`,
            adminId: user.id
          }
        });
      }
    } catch {
       // Ignore if audit fails
    }

    console.log(`\n🔒 [AUTH] PASSWORD_RESET successful for ${email}\n`);

    return NextResponse.json({ message: "Mission accomplished. Password updated." });
  } catch (error: any) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withSecurity(resetPasswordHandler, { limit: 50, window: 60 });
