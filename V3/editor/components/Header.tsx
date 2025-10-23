'use client'

import { SignedIn, SignInButton, SignedOut, UserButton } from "@clerk/nextjs";
import Breadcrumbs from "./Breadcrumbs";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { NotificationInbox } from "./NotificationInbox";
import Image from "next/image";

function Header({ className = '' }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-all duration-300 ${className}`}>
            <div className="h-9 hover-scale transition-transform duration-200">
                {mounted && theme === 'dark' ? (
                    <Image 
                        src="/kenlogodark.png" 
                        alt="Ken Logo" 
                        width={36} 
                        height={36} 
                        className="h-full w-auto" 
                        quality={100}
                        priority
                        unoptimized
                    />
                ) : (
                    <Image 
                        src="/kenlogo.png" 
                        alt="Ken Logo" 
                        width={36} 
                        height={36} 
                        className="h-full w-auto" 
                        quality={100}
                        priority
                        unoptimized
                    />
                )}
            </div>

            {/* Breadcrumbs - hidden on mobile */}
            <div className="hidden sm:block">
                <Breadcrumbs />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {mounted && (
                    <Button
                        variant="ghost"
                        className="rounded-full w-9 h-9 sm:w-10 sm:h-10 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 mobile-touch-target"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title={theme === 'dark' ? t("header.theme.light") : t("header.theme.dark")}
                        aria-label={theme === 'dark' ? t("header.theme.light") : t("header.theme.dark")}
                    >
                        {theme === 'dark' ? <SunIcon size={16} className="text-yellow-400" /> : <MoonIcon size={16} className="text-indigo-600" />}
                    </Button>
                )}

                <SignedOut>
                    <SignInButton />
                </SignedOut>

                <SignedIn>
                    <Suspense fallback={<div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />}>
                        <NotificationInbox />
                    </Suspense>
                    <div className="hover-scale transition-transform duration-200">
                        <UserButton />
                    </div>
                </SignedIn>
            </div>
        </div>
    )
}

export default Header;