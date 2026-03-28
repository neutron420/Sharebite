import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, description, location } = body;

    if (!type || !description) {
      return NextResponse.json({ error: "Type and description are required" }, { status: 400 });
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        type,
        description,
        location,
        reporterId: session.userId as string,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Notify Admins in real-time via WebSocket
    try {
      fetch("http://localhost:8081/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NEW_BUG_REPORT",
          targetRole: "ADMIN",
          payload: bugReport
        }),
      }).catch(() => {}); // Silence internal trigger errors
    } catch {}

    return NextResponse.json({ message: "Bug report submitted successfully", bugReport });
  } catch (error: any) {
    console.error("Bug report error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession({ request });
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bugReports = await prisma.bugReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        responses: {
          include: {
            admin: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bugReports || []);
  } catch (error: any) {
    console.error("GET BUGS ERROR LOG:", error.message, error.stack);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
