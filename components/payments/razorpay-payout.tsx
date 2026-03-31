"use client";

import React, { useState } from "react";
import Script from "next/script";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentButtonProps {
  requestId: string;
  amount: number;
  onSuccess: () => void | Promise<void>;
  className?: string;
  label?: string;
}

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

      // 2. Configure Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
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
              toast.success("Payment Received! Rider will be assigned.");
              onSuccess();
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (err) {
            toast.error("Critical error verifying payment.");
          }
        },
        prefill: {
          name: "Sharebite NGO",
        },
        theme: {
          color: "#ea580c",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Payment setup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      
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
