import { NextResponse } from "next/server";
import { getDeadlineRisk, toErrorEnvelope } from "@/lib/ai/service";

export async function GET() {
  const route = "/api/v1/ai/deadline-risk";

  try {
    const payload = await getDeadlineRisk();
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
