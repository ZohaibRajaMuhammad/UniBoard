export const appEnv = {
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
};

export const isClerkConfigured = appEnv.clerkPublishableKey.length > 0;
export const isClientDataConfigured = appEnv.convexUrl.length > 0;
export const isAppConfigured = isClerkConfigured && isClientDataConfigured;

export function getMissingClientEnvVars() {
  const missing: string[] = [];

  if (!isClerkConfigured) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  if (!isClientDataConfigured) {
    missing.push("NEXT_PUBLIC_CONVEX_URL");
  }

  return missing;
}
