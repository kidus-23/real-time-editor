'use client';

import HomePage from "@/components/HomePage";
import LandingPage from "@/components/LandingPage";
import { useUser } from "@clerk/nextjs";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Chatbar from "@/components/Chatbar";

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

  return (
    <>
      <Header />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-y-auto scrollbar-hide">
          <HomePage />
        </div>
      </div>
      <Chatbar />
    </>
  );
}