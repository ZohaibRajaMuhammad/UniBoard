"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } = useConvexAuth();
  const convexUser = useQuery(api.users.getCurrentUser);
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);
  const [syncRetry, setSyncRetry] = useState(0);

  useEffect(() => {
    if (!clerkLoaded || convexAuthLoading) {
      return;
    }

    if (!clerkUser || !convexAuthenticated || convexUser !== null) {
      return;
    }

    if (convexUser === undefined) {
      return;
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress;
    if (!email) {
      return;
    }

    let cancelled = false;

    void syncCurrentUser({
      email,
      name: clerkUser.fullName ?? clerkUser.username ?? "User",
      imageUrl: clerkUser.imageUrl
    }).catch(() => {
      if (cancelled) {
        return;
      }

      window.setTimeout(() => {
        if (!cancelled) {
          setSyncRetry((current) => current + 1);
        }
      }, 1200);
    });

    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkUser, convexAuthenticated, convexAuthLoading, convexUser, syncCurrentUser, syncRetry]);

  return convexUser;
}
