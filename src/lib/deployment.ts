export const appEnv = {
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY?.trim() ?? "",
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL?.trim() ?? ""
};

function hasWhitespace(value: string) {
  return /\s/.test(value);
}

export function isValidClerkPublishableKey(value: string) {
  if (!value || hasWhitespace(value)) {
    return false;
  }

  if (!/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(value)) {
    return false;
  }

  const suffix = value.replace(/^pk_(test|live)_/, "");
  return suffix.length > 20 && !suffix.includes("pk_test_") && !suffix.includes("pk_live_");
}

export function isValidClerkSecretKey(value: string) {
  return /^sk_(test|live)_[A-Za-z0-9_-]+$/.test(value) && !hasWhitespace(value);
}

export const isClerkConfigured = isValidClerkPublishableKey(appEnv.clerkPublishableKey);
export const isClerkServerConfigured =
  isClerkConfigured && isValidClerkSecretKey(appEnv.clerkSecretKey);
export const isClientDataConfigured = appEnv.convexUrl.length > 0;
export const isAppConfigured = isClerkServerConfigured && isClientDataConfigured;

export type SafeAuthState = {
  userId: string | null;
  authAvailable: boolean;
};

export function getMissingClientEnvVars() {
  const missing: string[] = [];

  if (!appEnv.clerkPublishableKey) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  } else if (!isClerkConfigured) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (invalid format)");
  }

  if (!appEnv.clerkSecretKey) {
    missing.push("CLERK_SECRET_KEY");
  } else if (!isValidClerkSecretKey(appEnv.clerkSecretKey)) {
    missing.push("CLERK_SECRET_KEY (invalid format)");
  }

  if (!isClientDataConfigured) {
    missing.push("NEXT_PUBLIC_CONVEX_URL");
  }

  return missing;
}

export async function getSafeAuthState(
  authResolver: () => Promise<{ userId: string | null }>
): Promise<SafeAuthState> {
  if (!isClerkServerConfigured) {
    return {
      userId: null,
      authAvailable: false
    };
  }

  try {
    const { userId } = await authResolver();
    return {
      userId,
      authAvailable: true
    };
  } catch {
    return {
      userId: null,
      authAvailable: false
    };
  }
}
