import { NextResponse } from "next/server";
import { assertSafePrompt } from "@/lib/ai/safety";
import { getKnowledgeAnswer, toErrorEnvelope } from "@/lib/ai/service";

export async function POST(request: Request) {
  const route = "/api/v1/ai/knowledge/query";

  try {
    const body = (await request.json()) as { question?: string };
    const question = assertSafePrompt(body.question ?? "");
    const payload = await getKnowledgeAnswer(question);
    return NextResponse.json(payload);
  } catch (error) {
    const handled = toErrorEnvelope(error, route);
    return NextResponse.json(handled.body, { status: handled.status });
  }
}
