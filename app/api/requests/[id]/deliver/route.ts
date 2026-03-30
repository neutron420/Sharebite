import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withSecurity } from "@/lib/api-handler";
import { createNotification } from "@/lib/notifications";
import redis from "@/lib/redis";
import { sendThankYouEmail } from "@/lib/email";
import { validateFoodImage, compareFoodImages } from "@/lib/vision";

async function deliveryHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RIDER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Riders or Admins only." }, { status: 401 });
    }

    const userId = session.userId as string;

    const { id } = await params;
    const body = await request.json();
    const { deliveryProofUrl } = body;

    if (!deliveryProofUrl) {
      return NextResponse.json({ error: "Proof of delivery image is required" }, { status: 400 });
    }

    // 1. Fetch the request with donor and NGO details (NECESSARY FOR VERIFICATION)
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id },
      include: { 
        donation: {
          include: {
            donor: true
          }
        },
        ngo: {
          select: {
            name: true,
            address: true,
            city: true,
            district: true,
            state: true,
            pincode: true
          }
        }
      }
    });

    if (!pickupRequest || (pickupRequest.riderId !== userId && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized task access" }, { status: 403 });
    }

    // 2. AI-based Quality Control: Verify that the rider is actually delivering food
    const isFood = await validateFoodImage(deliveryProofUrl);
    if (!isFood) {
      return NextResponse.json({ 
        error: "Image verification failed. The photo does not seem to be a clear picture of food. Please take a proper picture of the delivery." 
      }, { status: 400 });
    }

    // 3. Verify consistency between original posting and delivery proof
    const originalImageUrl = pickupRequest.donation.imageUrl;
    if (originalImageUrl) {
      const isSameItems = await compareFoodImages(originalImageUrl, deliveryProofUrl);
      if (!isSameItems) {
        return NextResponse.json({ 
          error: "Photo mismatch. The delivery photo does not seem to match the original donation items. Please ensure you are delivering the correct food." 
        }, { status: 400 });
      }
    }

    // SECURITY: Ensure food was actually picked up first
    if (pickupRequest.status !== "ON_THE_WAY" || pickupRequest.step !== 4) {
      return NextResponse.json(
        { error: "You must collect the food from donor before marking as delivered." },
        { status: 400 }
      );
    }

    // 2. Complete the Request and Update Donation Status
    const [] = await prisma.$transaction([
      prisma.pickupRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          deliveryImageUrl: deliveryProofUrl,
          step: 5, // Fully delivered
          completedAt: new Date()
        }
      }),
      prisma.foodDonation.update({
        where: { id: pickupRequest.donationId },
        data: { status: "COLLECTED" }
      })
    ]);

    // 3. Update Rider Stats & Availability
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalDeliveries: { increment: 1 },
        isAvailable: true
      }
    });

    // 4. Update Leaderboard Karma points
    await redis.zincrby("leaderboard:karma", 10, userId);

    // 5. Cleanup Redis Live Tracking
    await redis.del(`rider:pos:${userId}`);

    // 6. Notify the NGO
    await createNotification({
      userId: pickupRequest.ngoId,
      type: "REQUEST_STATUS",
      title: "Food Delivered! 🎉",
      message: `The rider has delivered the food to your location. Please confirm receipt.`,
      link: `/dashboard/requests/${id}`
    });

    // 7. Notify the Donor (In-app)
    const donor = pickupRequest.donation?.donor;
    if (donor) {
      const donorId = donor.id;
      await createNotification({
        userId: donorId,
        type: "REQUEST_STATUS",
        title: "Mission Accomplished!",
        message: `Your food donation has successfully reached the NGO. You've made a difference today!`,
        link: `/donor/donations/${pickupRequest.donation.id}`
      });

      // 8. Trigger Automated Email Dispatch (Donor)
      if (donor.email) {
        // Format NGO address for the email
        const ngo = pickupRequest.ngo;
        const fullNGOAddress = ngo ? [
          ngo.address,
          ngo.city,
          ngo.district,
          ngo.state,
          ngo.pincode
        ].filter(Boolean).join(", ") : "Delivered to NGO";

        // Fire-and-forget email dispatch
        sendThankYouEmail(
          donor.email, 
          donor.name || "Hero", 
          pickupRequest.donation.title,
          deliveryProofUrl,
          ngo?.name || "Our NGO Partner",
          fullNGOAddress
        ).catch(emailErr => {
          console.error(`[EMAIL_CRITICAL_FAILURE] Failed to dispatch thank you email to ${donor.email}`, emailErr);
        });
      }
    }


    return NextResponse.json({ 
      success: true, 
      message: "Delivery marked as complete. Great job hero!" 
    });



  } catch (error) {
    console.error("Delivery completion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PATCH = withSecurity(deliveryHandler, { limit: 100 });
