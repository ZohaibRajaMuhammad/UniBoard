import { NextResponse } from "next/server";
import { getRoomSummary, toErrorEnvelope } from "@/lib/ai/service";

export async function POST(request: Request) {
  const route = "/api/v1/ai/room-summary";

  try {
    const body = (await request.json()) as { roomId?: string };
    if (!body.roomId) {
      throw new Error("roomId is required.");
    }

    const payload = await getRoomSummary(body.roomId);
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
