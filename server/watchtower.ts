import { PrismaClient } from "../app/generated/prisma";
import "dotenv/config";

const prisma = new PrismaClient();

async function checkExpiringDonations() {
  console.log("Checking for expiring donations...");
  
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Find donations expiring in less than 2 hours that are still AVAILABLE
  const expiringSoon = await prisma.foodDonation.findMany({
    where: {
      status: "AVAILABLE",
      expiryTime: {
        gt: now,
        lt: twoHoursFromNow,
      },
    },
    include: {
        donor: { select: { city: true } }
    }
  });

  for (const donation of expiringSoon) {
    // Find verified NGOs in the same city
    const nearbyNGOs = await prisma.user.findMany({
      where: {
        role: "NGO",
        isVerified: true,
        city: donation.donor.city,
      },
    });

    for (const ngo of nearbyNGOs) {
      // Check if already notified
      const existing = await prisma.notification.findFirst({
        where: {
          userId: ngo.id,
          type: "URGENT_EXPIRY",
          link: `/donations/${donation.id}`
        }
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: ngo.id,
            type: "URGENT_EXPIRY",
            title: "🔥 Urgent: Food Expiring Soon!",
            message: `"${donation.title}" in ${donation.donor.city} is expiring in less than 2 hours. Rescue it now!`,
            link: `/donations/${donation.id}`
          }
        });
        console.log(`Alerted NGO ${ngo.name} about ${donation.title}`);
      }
    }
  }
}

// Run every 15 minutes
setInterval(checkExpiringDonations, 15 * 60 * 1000);
checkExpiringDonations();
