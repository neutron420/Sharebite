import prisma from "./prisma";

/**
 * Credits the rider's wallet after a successful delivery
 * @param riderId The ID of the rider
 * @param amount The amount in INR
 * @param requestId The ID of the pickup request
 */
export async function creditRiderWallet(
  riderId: string,
  amount: number,
  requestId: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get or create wallet
    let wallet = await tx.wallet.findUnique({
      where: { riderId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          riderId,
          balance: 0,
          totalEarnings: 0,
        },
      });
    }

    // 2. Add transaction log
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "CREDIT",
        purpose: "DELIVERY_PAYMENT",
      },
    });

    // 3. Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        totalEarnings: { increment: amount },
      },
    });


    return { wallet: updatedWallet, transaction };
  });
}

/**
 * Updates the rider's reward points
 * @param riderId The ID of the rider
 * @param points The points to add
 */
export async function addRewardPoints(riderId: string, points: number) {
  return await prisma.user.update({
    where: { id: riderId },
    data: {
      rewardPoints: { increment: points },
    },
  });
}
