'use client'

import { SignedIn, SignInButton, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Breadcrumbs from "./Breadcrumbs";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useMemo, useState, Suspense } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { NotificationInbox } from "./NotificationInbox";

function Header({ className = '' }: { className?: string }) {
    const { user } = useUser();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    const userDisplayName = useMemo(() => {
        return (
            user?.firstName ||
            user?.fullName ||
            user?.username ||
            user?.primaryEmailAddress?.emailAddress ||
            ""
        );
    }, [user]);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`glass-intense sticky top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${className}`}>
            <div className="h-9 hover-scale transition-transform duration-200">
                {mounted && theme === 'dark' ? (
                    <img src="/kenlogodark.png" alt="Ken Logo" className="h-full" />
                ) : (
                    <img src="/kenlogo.png" alt="Ken Logo" className="h-full" />
                )}
            </div>

            {/* Breadcrumbs */}
            <Breadcrumbs />

            <div className="flex items-center gap-4">
                {mounted && (
                    <Button
                        variant="ghost"
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center hover-scale transition-all duration-200 glass border-0"
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
                    <Suspense fallback={<div className="w-10 h-10 rounded-full glass animate-pulse" />}>
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