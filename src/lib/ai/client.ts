import type { AiEnvelope } from "@/lib/ai/contracts";

export async function getAi<T>(path: string, init?: Pick<RequestInit, "signal">) {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store",
    signal: init?.signal
  });

  const payload = (await response.json()) as AiEnvelope<T>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "AI request failed.");
  }

  return payload;
}

export async function postAi<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = (await response.json()) as AiEnvelope<T>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "AI request failed.");
  }

  return payload;
}
