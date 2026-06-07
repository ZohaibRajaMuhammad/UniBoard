"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } = useConvexAuth();
  const convexUser = useQuery(api.users.getCurrentUser);
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);

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

    void syncCurrentUser({
      email,
      name: clerkUser.fullName ?? clerkUser.username ?? "User",
      imageUrl: clerkUser.imageUrl
    });
  }, [clerkLoaded, clerkUser, convexAuthenticated, convexAuthLoading, convexUser, syncCurrentUser]);

  return convexUser;
}
