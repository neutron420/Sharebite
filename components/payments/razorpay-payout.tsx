"use client";

import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentButtonProps {
  requestId: string;
  amount: number;
  onSuccess: () => void | Promise<void>;
  className?: string;
  label?: string;
}

const sanitizeSecret = (value?: string) =>
  value?.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

const loadRazorpayCheckout = async () => {
  if (typeof window === "undefined") {
    throw new Error("Payment can only be opened in browser mode.");
  }

  if ((window as any).Razorpay) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => resolve();
      const onError = () => reject(new Error("Could not load Razorpay checkout."));
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
};

export default function RazorpayPayment({
  requestId,
  amount,
  onSuccess,
  className,
  label
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Create order on server
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, amount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Failed to initialize payment");
      }

      const orderData = await res.json();
      if (!orderData?.orderId || !orderData?.amount || !orderData?.currency) {
        throw new Error("Invalid payment order response from server.");
      }

      // 2. Configure Razorpay Options
      const razorpayKey = sanitizeSecret(String(orderData.keyId || ""));
      if (!razorpayKey) {
        toast.error("Razorpay public key is missing from production config.");
        return;
      }

      await loadRazorpayCheckout();

      const options = {
        key: razorpayKey, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Sharebite Delivery",
        description: `Delivery fee for request #${requestId.slice(0, 8)}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on server
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                requestId: requestId
              }),
            });

            if (verifyRes.ok) {
              toast.success("Payment successful. Rider payout released.");
              await onSuccess();
            } else {
              const verifyError = await verifyRes.json().catch(() => ({}));
              toast.error(verifyError.error || "Payment verification failed.");
            }
          } catch (err) {
            toast.error("Critical error verifying payment.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "Sharebite NGO",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: {
          color: "#ea580c",
        },
      };

      if (!(window as any).Razorpay) {
        toast.error("Payment gateway is still loading. Please retry in a moment.");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Payment setup failed.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <CreditCard className="w-4 h-4 text-white" />
        )}
        {label || "Pay Delivery Fee"} (₹{amount})
      </button>
    </>
  );
}
