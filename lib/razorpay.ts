import Razorpay from "razorpay";
import crypto from "crypto";

let _razorpay: Razorpay | null = null;

function getRazorpay() {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Critical: Razorpay keys are missing in environment variables.", {
        hasKeyId: !!keyId,
        hasKeySecret: !!keySecret,
        nodeEnv: process.env.NODE_ENV
      });
      throw new Error(`Razorpay keys missing: ${!keyId ? 'RAZORPAY_KEY_ID ' : ''}${!keySecret ? 'RAZORPAY_KEY_SECRET' : ''}`);
    }
    _razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return _razorpay;
}

/**
 * Creates a new Razorpay order
 * @param amount Amount in INR
 */
export async function createOrder(amount: number, receipt: string) {
  try {
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: receipt.slice(0, 40),
    };

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
}

export function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
) {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
}
