export const appEnv = {
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
};

export const isClerkConfigured = appEnv.clerkPublishableKey.length > 0;
export const isClerkServerConfigured =
  appEnv.clerkPublishableKey.length > 0 && appEnv.clerkSecretKey.length > 0;
export const isClientDataConfigured = appEnv.convexUrl.length > 0;
export const isAppConfigured = isClerkServerConfigured && isClientDataConfigured;

export function getMissingClientEnvVars() {
  const missing: string[] = [];

  if (!isClerkConfigured) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  if (!appEnv.clerkSecretKey) {
    missing.push("CLERK_SECRET_KEY");
  }

  if (!isClientDataConfigured) {
    missing.push("NEXT_PUBLIC_CONVEX_URL");
  }

  return missing;
}
