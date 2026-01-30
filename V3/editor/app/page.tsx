'use client';

import HomePage from "../components/HomePage";
import LandingPage from "../components/LandingPage";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  // Show loading state while checking auth
  if (!isLoaded) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
    </div>;
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return <HomePage />;
}