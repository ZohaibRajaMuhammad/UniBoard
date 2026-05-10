import { NextResponse } from "next/server";
import { getStudyPlan, toErrorEnvelope } from "@/lib/ai/service";

export async function GET() {
  const route = "/api/v1/ai/study-plan";

  try {
    const payload = await getStudyPlan();
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
