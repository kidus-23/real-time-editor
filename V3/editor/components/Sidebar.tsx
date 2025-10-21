"use client"
import { HomeIcon, MenuIcon, SearchIcon, GitGraphIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import NewDocumentButton from "./NewDocumentButton"
import { useCollection } from "react-firebase-hooks/firestore";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import { useUser } from "@clerk/nextjs";
import { collectionGroup, DocumentData, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useEffect, useState } from "react";
import SidebarOption from "./SidebarOption";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchDialog from "./SearchDialog";
import { useTranslation } from "@/hooks/useTranslation";

interface RoomDocument extends DocumentData {
    createdAt: string;
    role: "owner" | "editor";
    roomId: string;
    userId: string;
}

function Sidebar({ className = '' }: { className?: string }) {
    const { user } = useUser();
    const pathname = usePathname();
    const isHomeActive = pathname === "/";
    const isGraphActive = pathname === "/graph";
    const isSettingsActive = pathname === "/settings"; // Add this line
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const { t } = useTranslation();

    const [groupedData, setGroupedData] = useState<{
        owner: RoomDocument[];
        editor: RoomDocument[];
    }>({
        owner: [],
        editor: [],
    });

    const [data] = useCollection(
        user &&
        query(
            collectionGroup(db, 'rooms'),
            where('userId', '==', user.emailAddresses[0].toString())
        )
    );

    useEffect(() => {
        if (!data) return;

        const grouped = data.docs.reduce<{
            owner: RoomDocument[];
            editor: RoomDocument[];
        }>(
            (acc, curr) => {
                const roomData = curr.data() as RoomDocument;

                if (roomData.role === "owner") {
                    acc.owner.push({
                        id: curr.id,
                        ...roomData,
                    });
                } else {
                    acc.editor.push({
                        id: curr.id,
                        ...roomData,
                    })
                }

                return acc;
            }, {
            owner: [],
            editor: [],
        }
        )
        setGroupedData(grouped);
    }, [data])

    const menuOptions = (
        <>
            <div className="flex items-center mb-6 gap-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2.5 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200 hover-scale glass border-0"
                >
                    {isExpanded ? (
                        <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                </button>
                {isExpanded && user && (
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
                        {(user.firstName || user.fullName || user.username || user.primaryEmailAddress?.emailAddress)}'s Space
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 w-full">
                {/* Home Button */}
                <Link
                    href="/"
                    className={`flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ease-out hover-scale
                        ${isHomeActive
                            ? "bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"}
                        ${!isExpanded ? "justify-center" : ""}
                    `}
                    title={!isExpanded ? t("sidebar.home") : ""}
                >
                    <HomeIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-semibold">{t("sidebar.home")}</p>}
                </Link>

                {/* Search Button */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className={`flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ease-out hover-scale
                        text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80
                        ${!isExpanded ? "justify-center" : ""}`}
                    title={!isExpanded ? t("sidebar.search") : ""}
                >
                    <SearchIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-semibold">{t("sidebar.search")}</p>}
                </button>

                {/* Graph Button */}
                <Link
                    href="/graph"
                    className={`flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ease-out hover-scale
                        ${isGraphActive
                            ? "bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 font-semibold shadow-sm"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"}
                        ${!isExpanded ? "justify-center" : ""}
                    `}
                    title={!isExpanded ? t("sidebar.graph") : ""}
                >
                    <GitGraphIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-semibold">{t("sidebar.graph")}</p>}
                </Link>

                {/* Settings */}
                <Link
                    href="/settings"
                    className={`flex items-center w-full gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ease-out hover-scale
                        ${isSettingsActive
                            ? "bg-gray-500/10 dark:bg-gray-400/10 text-gray-700 dark:text-gray-300 font-semibold shadow-sm"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"}
                        ${!isExpanded ? "justify-center" : ""}
                    `}
                    title={!isExpanded ? t("sidebar.settings") : ""}
                >
                    <SettingsIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-semibold">{t("sidebar.settings")}</p>}
                </Link>

                {/* New Document Button */}
                <div className="mt-4 mb-2">
                    {!isExpanded ? (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-blue-500/10 dark:hover:bg-blue-400/10 transition-all duration-200 text-blue-600 dark:text-blue-400 hover-scale"
                            title={t("sidebar.newDocument")}
                        >
                            <PlusIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                    ) : (
                        <div className="w-full">
                            <NewDocumentButton />
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-col gap-4 py-5 w-full max-w-[250px]">
                    {/*My Document List...*/}
                    {groupedData.owner.length === 0 ? (
                        <h2 className="text-sm text-gray-500 dark:text-gray-400 font-medium italic px-2">
                            {t("sidebar.noDocuments")}
                        </h2>
                    ) : (
                        <>
                            <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold px-2 mb-1">
                                {t("sidebar.myDocuments")}
                            </h2>
                            <div className="flex flex-col gap-1.5">
                                {groupedData.owner.map((doc) => (
                                    <SidebarOption
                                        key={doc.id}
                                        id={doc.id}
                                        href={`/doc/${doc.id}`}
                                        isExpanded={isExpanded}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/*Shared with Me*/}
                    {groupedData.editor.length > 0 && (
                        <>
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-2"></div>
                            <h2 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold px-2 mb-1">
                                {t("sidebar.sharedWithMe")}
                            </h2>
                            <div className="flex flex-col gap-1.5">
                                {groupedData.editor.map((doc) => (
                                    <SidebarOption
                                        key={doc.id}
                                        id={doc.id}
                                        href={`/doc/${doc.id}`}
                                        isExpanded={isExpanded}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Search Dialog */}
            <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );

    return (
        <div className={`p-4 md:p-6 glass min-h-screen border-r border-gray-200/50 dark:border-gray-800/50 h-full transition-all duration-300 ease-out ${isExpanded ? 'w-[280px]' : 'w-[76px]'} ${className}`}>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover-scale" suppressHydrationWarning={true}>
                            <MenuIcon className="text-gray-700 dark:text-gray-200" size={24} />
                        </button>
                    </SheetTrigger>
                    <SheetContent side='left' className="glass-intense">
                        <SheetHeader>
                            <SheetTitle className="text-xl font-bold tracking-tight">{t("sidebar.menu")}</SheetTitle>
                            <div>
                                {menuOptions}
                            </div>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden md:block">
                {menuOptions}
            </div>
        </div>
    );
}

export default Sidebar;