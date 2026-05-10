import { NextResponse } from "next/server";
import { assertSafePrompt } from "@/lib/ai/safety";
import { getAssistantReply, toErrorEnvelope } from "@/lib/ai/service";

export async function POST(request: Request) {
  const route = "/api/v1/ai/assistant";

  try {
    const body = (await request.json()) as { message?: string; roomId?: string };
    const message = assertSafePrompt(body.message ?? "");
    const payload = await getAssistantReply(message, body.roomId);
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
