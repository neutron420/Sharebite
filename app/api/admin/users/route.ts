import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSecurity } from "@/lib/api-handler";

async function getUsersHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const roleFilter = searchParams.get("role") as any;
    
    const where: any = {};
    if (roleFilter) {
      where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        city: true,
        isAvailable: true,
        rating: true,
        totalDeliveries: true,
        createdAt: true
      }
    });

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withSecurity(getUsersHandler);
