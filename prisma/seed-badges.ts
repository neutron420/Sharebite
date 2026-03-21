import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DONOR_BADGES = [
  { name: "First Spark", description: "Complete your 1st donation.", criteria: { type: "COUNT", value: 1 } },
  { name: "The Feeding Hand", description: "First donation verified by an NGO.", criteria: { type: "VERIFIED_COUNT", value: 1 } },
  { name: "Good Samaritan", description: "Complete 5 verified donations.", criteria: { type: "VERIFIED_COUNT", value: 5 } },
  { name: "Community Pillar", description: "Complete 25 verified donations.", criteria: { type: "VERIFIED_COUNT", value: 25 } },
  { name: "Humanitarian Legend", description: "Complete 100 verified donations!", criteria: { type: "VERIFIED_COUNT", value: 100 } },
  { name: "Bronze Lifesaver", description: "Donate a total of 10kg of food.", criteria: { type: "WEIGHT", value: 10 } },
  { name: "Silver Lifesaver", description: "Donate a total of 50kg of food.", criteria: { type: "WEIGHT", value: 50 } },
  { name: "Gold Lifesaver", description: "Donate a total of 100kg of food.", criteria: { type: "WEIGHT", value: 100 } },
  { name: "Diamond Giver", description: "Reach a total of 250kg impact.", criteria: { type: "WEIGHT", value: 250 } },
  { name: "Seven-Day Streak", description: "Make a donation for 7 consecutive days.", criteria: { type: "STREAK", value: 7 } },
  { name: "Monthly Master", description: "Make 15 donations in a single month.", criteria: { type: "MONTHLY_COUNT", value: 15 } },
  { name: "Early Bird", description: "List a donation before 8:00 AM.", criteria: { type: "TIME_EARLY", value: 8 } },
  { name: "Midnight Hero", description: "List a donation after 11:00 PM.", criteria: { type: "TIME_LATE", value: 23 } },
  { name: "Veggie Pioneer", description: "Donate 10 Vegetarian items.", criteria: { type: "CATEGORY_COUNT", category: "VEG", value: 10 } },
  { name: "Zero Waste Champ", description: "10+ donations with zero rider cancellations.", criteria: { type: "PERFECT_RECORD", value: 10 } },
  { name: "Karma Apprentice", description: "Reach 500 total Karma Points.", criteria: { type: "KARMA", value: 500 } },
  { name: "Karma Sensei", description: "Reach 2,500 total Karma Points.", criteria: { type: "KARMA", value: 2500 } },
  { name: "Grandmaster of Generosity", description: "Reach 10,000 total Karma Points.", criteria: { type: "KARMA", value: 10000 } },
  { name: "Diverse Giver", description: "Donate 5 different food categories.", criteria: { type: "DIVERSE_CATEGORIES", value: 5 } },
  { name: "ShareBite OG", description: "Member for 6 months with 10+ donations.", criteria: { type: "SENIORITY", months: 6, count: 10 } },
];

async function main() {
  console.log("🏅 Seeding 20 Donor Badges...");
  for (const badge of DONOR_BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: { description: badge.description, criteria: badge.criteria },
      create: { name: badge.name, description: badge.description, criteria: badge.criteria },
    });
    console.log(`  ✓ ${badge.name}`);
  }
  console.log("🎉 All 20 badges seeded successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
