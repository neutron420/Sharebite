import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { withSecurity } from "@/lib/api-handler";

async function verifyOtpHandler(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // SECURITY: Ensure both are strictly strings to block query injection
    if (typeof email !== "string" || typeof otp !== "string") {
      return NextResponse.json({ error: "Invalid data types provided." }, { status: 400 });
    }

    // 1. Get OTP from Redis
    const storedOtp = await redis.get(`otp:${email}`);

    if (!storedOtp) {
      return NextResponse.json({ error: "The OTP has expired or hasn't been sent. Please restart." }, { status: 410 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Access Denied." }, { status: 401 });
    }

    // 2. Clear OTP (Optional: Or keep and delete after final reset)
    // await redis.del(`otp:${email}`);

    return NextResponse.json({ message: "Verification successful." });
  } catch (error: any) {
    console.error("[VERIFY_OTP_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withSecurity(verifyOtpHandler, { limit: 50, window: 60 });
