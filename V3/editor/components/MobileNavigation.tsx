'use client'

import { HomeIcon, MenuIcon, SearchIcon, GitGraphIcon, SettingsIcon, PlusIcon, FileTextIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import SearchDialog from "./SearchDialog";
import { useUser } from "@clerk/nextjs";
import { useCollection } from "react-firebase-hooks/firestore";
import { collectionGroup, query, where } from "firebase/firestore";
import { db } from "@/firebase";

export default function MobileNavigation() {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const isHomeActive = pathname === '/';
    const isGraphActive = pathname === '/graph';
    const isSettingsActive = pathname === '/settings';
    const isDocumentPage = pathname.startsWith('/doc/');
    
    // Get user's documents for the menu
    const [snapshot] = useCollection(
        user ? 
        query(
            collectionGroup(db, "rooms"),
            where("users", "array-contains", user.id)
        ) : null
    );
    
    const documents = snapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })).slice(0, 5) || [];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0f0f0f] border-t border-gray-200 dark:border-gray-800 md:hidden z-50">
                <div className="flex items-center justify-around py-2">
                    <Link 
                        href="/"
                        className={`flex flex-col items-center p-3 mobile-touch-target rounded-lg ${isHomeActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <HomeIcon className="w-5 h-5" />
                        <span className="text-xs mt-1">{t("sidebar.home")}</span>
                    </Link>
                    
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex flex-col items-center p-3 mobile-touch-target rounded-lg text-gray-700 dark:text-gray-300"
                    >
                        <SearchIcon className="w-5 h-5" />
                        <span className="text-xs mt-1">{t("sidebar.search")}</span>
                    </button>
                    
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="flex flex-col items-center p-3 mobile-touch-target rounded-lg text-gray-700 dark:text-gray-300">
                                <MenuIcon className="w-5 h-5" />
                                <span className="text-xs mt-1">{t("sidebar.menu")}</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85%] bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-gray-800 pt-8 p-0 overflow-y-auto">
                            {/* Use the existing Sidebar component for consistency */}
                            <div className="h-full overflow-y-auto">
                                <div className="p-4">
                                    <SheetHeader>
                                        <SheetTitle className="text-xl font-bold tracking-tight">{t("sidebar.menu")}</SheetTitle>
                                    </SheetHeader>
                                </div>
                                
                                <div className="px-4 py-2">
                                    <div className="space-y-3">
                                        <Link
                                            href="/"
                                            className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all mobile-touch-target
                                                ${isHomeActive ? "bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-700 dark:text-gray-300"}`}
                                        >
                                            <HomeIcon className="w-5 h-5" />
                                            <span className="text-base">{t("sidebar.home")}</span>
                                        </Link>
                                        
                                        <Link
                                            href="/graph"
                                            className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all mobile-touch-target
                                                ${isGraphActive ? "bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 font-semibold" : "text-gray-700 dark:text-gray-300"}`}
                                        >
                                            <GitGraphIcon className="w-5 h-5" />
                                            <span className="text-base">{t("sidebar.graph")}</span>
                                        </Link>
                                        
                                        <Link
                                            href="/settings"
                                            className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all mobile-touch-target
                                                ${isSettingsActive ? "bg-gray-500/10 dark:bg-gray-400/10 text-gray-700 dark:text-gray-300 font-semibold" : "text-gray-700 dark:text-gray-300"}`}
                                        >
                                            <SettingsIcon className="w-5 h-5" />
                                            <span className="text-base">{t("sidebar.settings")}</span>
                                        </Link>
                                    </div>
                                    
                                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                {t("sidebar.myDocuments")}
                                            </h3>
                                            <Link href="/new" className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full mobile-touch-target">
                                                <PlusIcon className="w-5 h-5" />
                                            </Link>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {documents.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic px-2">
                                                    {t("sidebar.noDocuments")}
                                                </p>
                                            ) : (
                                                documents.map(doc => (
                                                    <Link
                                                        key={doc.id}
                                                        href={`/doc/${doc.id}`}
                                                        className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all mobile-touch-target
                                                            ${pathname === `/doc/${doc.id}` ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium" : "text-gray-700 dark:text-gray-300"}`}
                                                    >
                                                        <FileTextIcon className="w-5 h-5 flex-shrink-0" />
                                                        <p className="truncate text-base max-w-[180px]">{doc.title || "Untitled"}</p>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    
                    <Link 
                        href="/graph"
                        className={`flex flex-col items-center p-3 mobile-touch-target rounded-lg ${isGraphActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <GitGraphIcon className="w-5 h-5" />
                        <span className="text-xs mt-1">{t("sidebar.graph")}</span>
                    </Link>
                    
                    <Link 
                        href="/settings"
                        className={`flex flex-col items-center p-3 mobile-touch-target rounded-lg ${isSettingsActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                        <SettingsIcon className="w-5 h-5" />
                        <span className="text-xs mt-1">{t("sidebar.settings")}</span>
                    </Link>
                </div>
            </div>
            
            {/* Search Dialog */}
            <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            
            {/* Add padding to the bottom of the page on mobile to account for the navigation bar */}
            <div className="h-16 md:hidden"></div>
        </>
    );
}