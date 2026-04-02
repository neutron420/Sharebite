import { getSession } from "@/lib/auth";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

export async function validateCommunityImage(base64Data: string, mimeType: string): Promise<ModerationResult> {
  if (!process.env.GROQ_API_KEY) {
    return { isSafe: true }; 
  }

  try {
    const prompt = 
      "You are a strict Community Safety Guard for ShareBite Hive. " +
      "Analyze this image for: NSFW content, violence, hate symbols, offensive gestures, drugs, or anything non-wholesome. " +
      "ShareBite is a community for helping people. " +
      "Respond with ONLY 'YES' if safe, or 'NO: [Brief Reason]' if unsafe.";

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
            { type: "text", text: prompt },
          ],
        }],
        max_tokens: 30,
        temperature: 0.1,
      }),
    });

    if (!response.ok) throw new Error("Groq API disconnected");
    const data = await response.json();
    const resultText = (data.choices?.[0]?.message?.content || "").toUpperCase().trim();

    if (resultText.startsWith("YES")) {
      return { isSafe: true };
    }

    const reason = resultText.replace("NO:", "").trim() || "Inappropriate image detected";
    return { isSafe: false, reason };
  } catch (error) {
    console.error("[SELF_MODERATION_ERROR] Image check failed:", error);
    return { isSafe: true }; 
  }
}

export async function validateCommunityText(text: string): Promise<ModerationResult> {
  if (!process.env.GROQ_API_KEY || !text.trim()) {
    return { isSafe: true };
  }

  try {
    const prompt = 
      "You are a high-fidelity moderator for a charitable social platform. " +
      "Analyze the following text for: toxicity, extreme slang, profanity, bullying, or scams. " +
      "Text: '" + text + "'\n" +
      "Respond with ONLY 'YES' if safe, or 'NO: [Brief Reason]' if unsafe.";

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 30,
        temperature: 0.1,
      }),
    });

    if (!response.ok) throw new Error("Groq API disconnected");
    const data = await response.json();
    const resultText = (data.choices?.[0]?.message?.content || "").toUpperCase().trim();

    if (resultText.startsWith("YES")) {
      return { isSafe: true };
    }

    const reason = resultText.replace("NO:", "").trim() || "Inappropriate language detected";
    return { isSafe: false, reason };
  } catch (error) {
    console.error("[SELF_MODERATION_ERROR] Text check failed:", error);
    return { isSafe: true };
  }
}
