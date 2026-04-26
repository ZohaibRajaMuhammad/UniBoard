import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!secret) {
    return new Response("Missing Clerk webhook secret", { status: 500 });
  }
  if (!secret.startsWith("whsec_")) {
    return new Response("Invalid Clerk webhook secret format", { status: 500 });
  }
  if (!convexUrl) {
    return new Response("Missing Convex URL", { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing webhook headers", { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(secret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const convex = new ConvexHttpClient(convexUrl);

  if (event.type === "user.created" || event.type === "user.updated") {
    const email = event.data.email_addresses?.find((entry) => entry.id === event.data.primary_email_address_id)?.email_address
      ?? event.data.email_addresses?.[0]?.email_address
      ?? "";

    await convex.mutation(api.users.upsertFromClerk, {
      clerkId: event.data.id,
      email,
      name: [event.data.first_name, event.data.last_name].filter(Boolean).join(" ").trim() || event.data.username || "User",
      imageUrl: event.data.image_url || undefined
    });
  }

  if (event.type === "user.deleted" && event.data.id) {
    await convex.mutation(api.users.removeByClerkId, {
      clerkId: event.data.id
    });
  }

  return Response.json({ received: true, type: event.type });
}
