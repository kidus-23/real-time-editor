"use client";

// Identifies the signed-in Clerk user in PostHog so events attach to a person
// profile instead of an anonymous one (person_profiles is 'identified_only').
// No-ops when the key is missing or nobody is signed in.

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogUserIdentify() {
  const { user } = useUser();

  useEffect(() => {
    if (!user || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
      username: user.username,
    });
  }, [user]);

  return null;
}
