"use client";

// PostHog provider — analytics + error tracking (posthog-js).
//
// The project key comes from NEXT_PUBLIC_POSTHOG_KEY; without it the provider
// renders children untouched and posthog stays disabled (safe for local dev
// and for deploys where the key hasn't been added yet).
//
// Docs: https://posthog.com/docs/libraries/next-js

import posthog from "posthog-js";
import { useEffect, useState, type ReactNode } from "react";

export function PHProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Capture exceptions for error tracking (enabled by default on new
      // PostHog projects).
      capture_exceptions: true,
      // Autocapture clicks, form submissions and page leaves.
      autocapture: true,
      // 'history_change' captures pageviews on load AND on Next.js client-side
      // route changes, without a separate pathname-watcher component.
      capture_pageview: "history_change",
      // Only create profiles for identified users (people who sign in).
      person_profiles: "identified_only",
      persistence: "localStorage+cookie",
    });
    setInitialized(true);
  }, [initialized]);

  return children;
}
