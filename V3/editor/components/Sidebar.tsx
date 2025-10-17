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

interface RoomDocument extends DocumentData {
    createdAt: string;
    role: "owner" | "editor";
    roomId: string;
    userId: string;
}

function Sidebar() {
    const { user } = useUser();
    const pathname = usePathname();
    const isHomeActive = pathname === "/";
    const isGraphActive = pathname === "/graph";
    const isSettingsActive = pathname === "/settings"; // Add this line
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

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
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mb-4 p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
                {isExpanded ? (
                    <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
            </button>

            <div className="flex flex-col gap-3 w-full">
                {/* Home Button */}
                <Link
                    href="/"
                    className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                        ${isHomeActive
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"}
                        ${!isExpanded ? "justify-center" : ""}
                    `}
                    title={!isExpanded ? "Home" : ""}
                >
                    <HomeIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-medium">Home</p>}
                </Link>

                {/* Search Button */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                        text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900
                        ${!isExpanded ? "justify-center" : ""}`}
                    title={!isExpanded ? "Search" : ""}
                >
                    <SearchIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-medium">Search</p>}
                </button>

                {/* Graph Button */}
                <Link
                    href="/graph"
                    className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                        ${isGraphActive
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"}
                        ${!isExpanded ? "justify-center" : ""}
                    `}
                    title={!isExpanded ? "Graph" : ""}
                >
                    <GitGraphIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-medium">Graph</p>}
                </Link>

                {/* Settings - Replace the button with Link */}
                <Link
                    href="/settings"
                    className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                        ${isSettingsActive
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"}
                        ${!isExpanded ? "justify-center" : ""}
                    `}
                    title={!isExpanded ? "Settings" : ""}
                >
                    <SettingsIcon className="w-4 h-4 flex-shrink-0" />
                    {isExpanded && <p className="text-sm leading-tight font-medium">Settings</p>}
                </Link>

                {/* New Document Button */}
                <div className="mt-2 mb-1">
                    {!isExpanded ? (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors text-gray-700 dark:text-gray-300"
                            title="New Document"
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
                <div className="flex flex-col gap-3 py-4 w-full max-w-[250px] divide-y divide-gray-100 dark:divide-neutral-800">
                    {/*My Document List...*/}
                    {groupedData.owner.length === 0 ? (
                        <h2 className="text-sm text-gray-400 dark:text-neutral-500 font-medium italic px-1">
                            No documents yet
                        </h2>
                    ) : (
                        <>
                            <h2 className="text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold px-1">
                                My Documents
                            </h2>
                            <div className="flex flex-col gap-1 pt-2">
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
                            <h2 className="text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400 font-semibold pt-3 px-1">
                                Shared with me
                            </h2>
                            <div className="flex flex-col gap-1 pt-2">
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
        <div className={`p-3 md:p-5 bg-white min-h-screen dark:bg-[#090e19] border-r border-gray-100 dark:border-neutral-800 h-full transition-all duration-200 ${isExpanded ? 'w-[280px]' : 'w-[68px]'}`}>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                            <MenuIcon className="text-gray-700 dark:text-gray-200" size={24} />
                        </button>
                    </SheetTrigger>
                    <SheetContent side='left'>
                        <SheetHeader>
                            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
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