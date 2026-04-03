import { NextResponse } from "next/server";
import { getAppMetrics, getAppMetricsContentType } from "@/lib/monitoring/prometheus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await getAppMetrics();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": getAppMetricsContentType(),
      "Cache-Control": "no-store",
    },
  });
}
