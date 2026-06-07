"use client";

import { useAuth } from "@clerk/nextjs";

export function useClerkAuthReady() {
  const { isLoaded, isSignedIn } = useAuth();

  return {
    isLoaded,
    isSignedIn,
    isReady: isLoaded && isSignedIn
  };
}
