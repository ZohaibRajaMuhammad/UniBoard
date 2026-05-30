import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkServerConfigured } from "@/lib/deployment";

const guardedClerkMiddleware = isClerkServerConfigured
  ? clerkMiddleware()
  : () => NextResponse.next();

export default guardedClerkMiddleware;

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
};
