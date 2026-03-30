const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function validateFoodImageBase64(base64Data: string, mimeType: string, category?: string): Promise<boolean> {
  if (!process.env.GROQ_API_KEY) {
    console.warn("[VISION] GROQ_API_KEY is missing. Food validation skipped.");
    return true; 
  }

  try {
    const contextPrompt = 
      "You are a highly accurate food verification AI for ShareBite, a charitable donation platform. " +
      "Your mission is to ensure only safe, consumable, and appropriate food/drinks are donated. " +
      (category ? `The user has categorized this as '${category}'. ` : "") +
      "STRICT RULES:\n" +
      "1. ALLOW: Fresh produce, cooked meals, bakery, dairy, packaged food, and NON-ALCOHOLIC beverages.\n" +
      "2. REJECT (Respond NO): Alcoholic beverages (Wine, Beer, Whiskey, etc.), Tobacco, Drugs, Non-edible items, Raw meat/eggs if not in a cold-chain category, selfies, or screenshots.\n" +
      "3. CATEGORY CHECK: If labeled as 'VEG', reject if meat is visible.\n" +
      "Respond with ONLY 'YES' if it passes all safety and category checks, otherwise 'NO'. No explanation.";

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
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
            {
              type: "text",
              text: contextPrompt,
            },
          ],
        }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    const responseText = (data.choices?.[0]?.message?.content || "").toUpperCase().trim();
    const isFood = responseText.includes("YES");

    console.log(`[VISION] Result: ${isFood ? "APPROVED" : "REJECTED"} | Response: "${responseText}" | Category: ${category || 'General'}`);
    return isFood;
  } catch (error: any) {
    console.error("[VISION_ERROR] Groq verification failed:", error?.message || error);
    return false;
  }
}

/**
 * Validates if the provided image URL contains food. Used for delivery proof verification.
 */
export async function validateFoodImage(imageUrl: string, category?: string): Promise<boolean> {
  if (!process.env.GROQ_API_KEY) return true;

  try {
    if (!imageUrl || !imageUrl.startsWith('http')) return true;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error("Image fetch failed");

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    return await validateFoodImageBase64(base64Data, contentType, category);
  } catch (error: any) {
    console.error("[VISION_ERROR] URL verification failed:", error?.message || error);
    return false;
  }
}

/**
 * Compares two images to verify if they represent the same delivery items.
 */
export async function compareFoodImages(originalImageUrl: string, deliveryImageUrl: string): Promise<boolean> {
  if (!process.env.GROQ_API_KEY) return true;

  try {
    if (!originalImageUrl || !deliveryImageUrl) return true;

    const [originalRes, deliveryRes] = await Promise.all([
      fetch(originalImageUrl),
      fetch(deliveryImageUrl)
    ]);

    if (!originalRes.ok || !deliveryRes.ok) return true;

    const [originalBuffer, deliveryBuffer] = await Promise.all([
      originalRes.arrayBuffer(),
      deliveryRes.arrayBuffer()
    ]);

    const originalBase64 = Buffer.from(originalBuffer).toString("base64");
    const deliveryBase64 = Buffer.from(deliveryBuffer).toString("base64");
    const originalMime = originalRes.headers.get("content-type") || "image/jpeg";
    const deliveryMime = deliveryRes.headers.get("content-type") || "image/jpeg";

    const comparisonPrompt = 
      "You are a delivery auditor. Image 1 is the donor's original food photo. Image 2 is the rider's delivery proof. " +
      "Are they the same items? (Different angle or packaging is OK). " +
      "Reply with ONLY YES or NO.";

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
            { type: "image_url", image_url: { url: `data:${originalMime};base64,${originalBase64}` } },
            { type: "image_url", image_url: { url: `data:${deliveryMime};base64,${deliveryBase64}` } },
            { type: "text", text: comparisonPrompt },
          ],
        }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

    const data = await response.json();
    const isSame = (data.choices?.[0]?.message?.content || "").toUpperCase().includes("YES");

    console.log(`[VISION] Comparison: ${isSame ? "MATCH" : "MISMATCH"}`);
    return isSame;
  } catch (error) {
    console.error("[VISION_ERROR] Similarity check failed:", error);
    return true;
  }
}
