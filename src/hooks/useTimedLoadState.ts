"use client";

import { useEffect, useState } from "react";

export function useTimedLoadState(value: unknown, timeoutMs = 2000) {
  const isWaiting = value === undefined;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isWaiting) {
      setTimedOut(false);
      return;
    }

    setTimedOut(false);
    const timeout = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [isWaiting, timeoutMs]);

  return {
    isLoading: isWaiting && !timedOut,
    timedOut: isWaiting && timedOut
  };
}
