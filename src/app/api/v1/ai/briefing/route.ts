import { NextResponse } from "next/server";
import { getBriefing, toErrorEnvelope } from "@/lib/ai/service";

export async function GET() {
  const route = "/api/v1/ai/briefing";

  try {
    const payload = await getBriefing();
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
