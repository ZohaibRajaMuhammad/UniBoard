import { NextResponse } from "next/server";
import { assertSafePrompt } from "@/lib/ai/safety";
import { getAssistantReply, toErrorEnvelope } from "@/lib/ai/service";
import type { AiEnvelope, AssistantReply } from "@/lib/ai/contracts";

export async function POST(request: Request) {
  const route = "/api/v1/ai/assistant";

  try {
    const body = (await request.json()) as { message?: string; roomId?: string };
    const message = assertSafePrompt(body.message ?? "");
    const payload = await getAssistantReply(message, body.roomId);
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);

    if (handled.status >= 500) {
      const fallback: AiEnvelope<AssistantReply> = {
        data: {
          reply:
            "UniBoard AI is temporarily running without full workspace access. I cannot answer from your live class data right now, but your rooms, planner, posts, and notifications are still available in the main screens.",
          confidenceBand: "low",
          suggestions: [
            "Open Planner to check upcoming deadlines.",
            "Open Rooms to review the latest class posts.",
            "Try the assistant again after the AI service reconnects."
          ],
          sources: []
        },
        meta: {
          ...handled.body.meta,
          mode: "fallback"
        },
        error: null
      };

      return NextResponse.json(fallback, { status: 200 });
    }

    return NextResponse.json(handled.body, { status: handled.status });
  }
}
