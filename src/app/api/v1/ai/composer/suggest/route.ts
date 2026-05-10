import { NextResponse } from "next/server";
import { assertSafePrompt } from "@/lib/ai/safety";
import { getComposerSuggestion, toErrorEnvelope } from "@/lib/ai/service";

export async function POST(request: Request) {
  const route = "/api/v1/ai/composer/suggest";

  try {
    const body = (await request.json()) as { prompt?: string; roomId?: string };
    const prompt = assertSafePrompt(body.prompt ?? "");
    const payload = await getComposerSuggestion(prompt, body.roomId);
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
