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

function Header() {
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
        <div className="flex items-center justify-between p-5">
            {user && (
                <h1 className="text-2xl">
                    {t("header.spaceTitle", { name: userDisplayName })}
                </h1>
            )}

            {/* Breadcrumbs */}
            <Breadcrumbs />

            <div className="flex items-center gap-3">
                <LanguageSwitcher />
                {mounted && (
                    <Button
                        className={`${theme === 'dark' ?
                            "text-gray-100 bg-gray-800/90 hover:bg-gray-700/90 border-gray-700" :
                            "text-gray-700 bg-white/90 hover:bg-gray-50/90 border-gray-200"} 
                            border rounded-full w-8 h-8 p-0 flex items-center justify-center shadow-sm transition-all duration-200 backdrop-blur-sm`}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title={theme === 'dark' ? t("header.theme.light") : t("header.theme.dark")}
                        aria-label={theme === 'dark' ? t("header.theme.light") : t("header.theme.dark")}
                    >
                        {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                    </Button>
                )}

                <SignedOut>
                    <SignInButton />
                </SignedOut>

                <SignedIn>
                    <Suspense fallback={<div className="w-8 h-8" />}>
                        <NotificationInbox />
                    </Suspense>
                    <UserButton />
                </SignedIn>
            </div>
        </div>
    )
}

export default Header;