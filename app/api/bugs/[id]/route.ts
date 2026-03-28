import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await getSession({ request });
    
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, message } = body;

    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: {
        ...(status && { status }),
      },
    });

    if (message) {
      await prisma.bugResponse.create({
        data: {
          message,
          adminId: session.userId as string,
          bugReportId: id,
        },
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: bugReport.reporterId,
          type: "BUG_RESPONSE",
          title: "Bug Report Update",
          message: `Admin Response: ${message}`,
          link: "/profile/reports",
        },
      });
    }

    return NextResponse.json({ message: "Bug report updated and response sent", bugReport });
  } catch (error: any) {
    console.error("Bug report update error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
