"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useUnreadCounts() {
  const totalUnread = useQuery(api.rooms.getTotalUnreadCount);
  const unreadNotifications = useQuery(api.notifications.getUnreadNotificationCount);

  return {
    totalUnread: totalUnread ?? 0,
    unreadNotifications: unreadNotifications ?? 0
  };
}
