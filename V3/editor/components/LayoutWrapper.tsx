'use client'

import { useUser } from "@clerk/nextjs"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import Chatbar from "@/components/Chatbar"
import MobileNavigation from "@/components/MobileNavigation"
import { usePathname } from "next/navigation"
import { useZenMode } from "@/contexts/ZenModeContext"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { isSignedIn } = useUser()
    const pathname = usePathname()
    const { zenMode } = useZenMode()

    // Don't show header/sidebar on landing page (root when not signed in)
    const isLandingPage = pathname === '/' && !isSignedIn

    if (isLandingPage) {
        return <>{children}</>
    }

    return (
        <>
            {!zenMode && <Header />}
            <div className="flex min-h-screen">
                {!zenMode && <Sidebar />}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-y-auto scrollbar-hide">
                    <div className="md:p-0 mobile-px">
                        {children}
                    </div>
                </div>
            </div>
            {!zenMode && <Chatbar />}
            {!zenMode && <MobileNavigation />}
        </>
    )
}
