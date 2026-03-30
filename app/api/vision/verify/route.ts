import { NextResponse } from "next/server";
import { validateFoodImageBase64 } from "@/lib/vision";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { base64Data, mimeType, category } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: "base64Data and mimeType are required" }, { status: 400 });
    }

    console.log(`[AI_VALIDATION] Groq pre-upload check (Category: ${category || 'none'}, Size: ${Math.round(base64Data.length / 1024)}KB)`);
    const isFood = await validateFoodImageBase64(base64Data, mimeType, category);

    return NextResponse.json({ 
      success: true, 
      isFood,
      message: isFood ? "Image verified as food!" : "Image does not appear to be food."
    });

  } catch (error) {
    console.error("AI Validation API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
