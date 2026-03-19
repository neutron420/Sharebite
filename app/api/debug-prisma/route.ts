import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const keys = Object.keys(prisma);
  const donorReportKey = keys.find(k => k.toLowerCase().includes("donorreport"));
  return NextResponse.json({
    keys: keys.slice(0, 50),
    donorReportKey: donorReportKey || "NOT FOUND"
  });
}
