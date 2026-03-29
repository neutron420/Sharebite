import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { Resend } from "resend";
import { withSecurity } from "@/lib/api-handler";

const resend = new Resend(process.env.RESEND_API_KEY);
const TURNSTILE_SITE_SECRET = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

async function forgotPasswordHandler(req: Request) {
  try {
    const { email, role, turnstileToken } = await req.json();

    if (!email || !turnstileToken || !role) {
      return NextResponse.json({ error: "Email, Role and Security Check are required" }, { status: 400 });
    }

    // SECURITY: strictly enforce types to prevent prototype/object injection
    if (typeof email !== "string" || typeof role !== "string" || typeof turnstileToken !== "string") {
      return NextResponse.json({ error: "Invalid data types provided." }, { status: 400 });
    }

    // 1. Verify Turnstile Token
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SITE_SECRET,
        response: turnstileToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "Security check failed. Please refresh." }, { status: 403 });
    }

    // 2. Iron-Strict: Role match check
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== role) {
      return NextResponse.json({ 
        error: `Authentication failed. This terminal is not registered as a ${role.toLowerCase()}.` 
      }, { status: 401 });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Store in Redis
    await redis.set(`otp:${email}`, otp, "EX", 1200); // 20 minutes

    // 5. Secure Email Dispatch via Resend
    let emailStatus = "Dispatched via Resend";
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "ShareBite Support <support@neutrondev.in>";
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "Security Alert: Your Access Code",
        html: `
          <div style="font-family: sans-serif; background: #fffaf8; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; border: 1px solid #feeae2;">
              <h1 style="color: #ea580c; margin-bottom: 20px;">Verification Code</h1>
              <p style="color: #64748b;">Enter this code to reset your <b>${role.toLowerCase()}</b> password:</p>
              <div style="background: #fff7f4; padding: 20px; text-align: center; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 30px 0;">
                ${otp}
              </div>
              <p style="color: #94a3b8; font-size: 12px;">This code expires in 20 minutes. If you didn't request this, secure your account immediately.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("❌ [RESEND_API_ERROR]", error);
        
        // Critical Tip for the User:
        if (error.message.includes("onboarding@resend.dev") || error.name === "validation_error") {
          return NextResponse.json({ 
            error: "Production Email configuration required: Please add RESEND_FROM_EMAIL to your .env with your verified domain (e.g., support@yourdomain.com), or use the email you signed up to Resend with." 
          }, { status: 500 });
        }
        
        return NextResponse.json({ error: `Email routing failed: ${error.message}` }, { status: 500 });
      } else {
        console.log(`✅ [AUTH] OTP Successfully Sent to ${email} (Role: ${role})`);
      }
    } catch (catchErr: any) {
      console.error("❌ [RESEND_NETWORK_ERROR]", catchErr);
      return NextResponse.json({ error: "Email delivery service unavailable." }, { status: 500 });
    }

    // 📢 DEVELOPER COMPONENT: Log to terminal for local testing
    console.log(`\n---------------------------------`);
    console.log(`🔐 SECURITY DISPATCH SUMMARY:`);
    console.log(`📧 Target: ${email}`);
    console.log(`🎭 Profile: ${role}`);
    console.log(`🔑 Access Token: ${otp}`);
    console.log(`📬 Send Status: ${emailStatus}`);
    console.log(`---------------------------------\n`);

    return NextResponse.json({ 
      message: "OTP Dispatched.",
      devHint: "If the email doesn't arrive, check your server terminal for the code.",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined
    });
  } catch (err: any) {
    console.error("[FORGOT_PASSWORD_HANDLER_ERROR]", err);
    return NextResponse.json({ error: "Secure server initialization failed" }, { status: 500 });
  }
}

export const POST = withSecurity(forgotPasswordHandler, { limit: 50, window: 60 });
