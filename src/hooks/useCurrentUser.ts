"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const syncCurrentUser = useMutation(api.users.syncCurrentUser);

  useEffect(() => {
    if (!clerkUser || convexUser !== null) {
      return;
    }

    if (convexUser === undefined) {
      return;
    }

    void syncCurrentUser({
      email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      name: clerkUser.fullName ?? clerkUser.username ?? "User",
      imageUrl: clerkUser.imageUrl
    });
  }, [clerkUser, convexUser, syncCurrentUser]);

  return convexUser;
}
