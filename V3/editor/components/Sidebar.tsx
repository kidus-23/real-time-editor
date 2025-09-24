"use client"
import { HomeIcon, MenuIcon, SearchIcon } from "lucide-react";
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
    role: "owner" | "editor"; //add a viewer later
    roomId: string;
    userId: string;
}

function Sidebar() {
    const { user } = useUser();
    const pathname = usePathname();
    const isHomeActive = pathname === "/";
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const [groupedData, setGroupedData] = useState<{
        owner: RoomDocument[];
        editor: RoomDocument[];
    }>({
        owner: [],
        editor: [],
    });
    const [data, loading, error] = useCollection(
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
            <div className="flex flex-col gap-3 w-full max-w-xs">
                {/* Home Button */}
                <Link
                    href="/"
                    className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                        ${isHomeActive
                            ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"}
                    `}
                >
                    <HomeIcon className="w-4 h-4" />
                    <p className="text-sm leading-tight font-medium">Home</p>
                </Link>
                
                {/* Search Button */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                        text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"
                >
                    <SearchIcon className="w-4 h-4" />
                    <p className="text-sm leading-tight font-medium">Search</p>
                </button>
                
                <div className="mt-2 mb-1">
                    <NewDocumentButton />
                </div>
            </div>
            
            <div className="flex flex-col gap-3 py-4 w-full max-w-xs divide-y divide-gray-100 dark:divide-neutral-800">
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
                                <SidebarOption key={doc.id} id={doc.id} href={`/doc/${doc.id}`} />
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
                            <SidebarOption key={doc.id} id={doc.id} href={`/doc/${doc.id}`} />
                        ))}
                    </div>
                </>

            )}
             </div>
             
             {/* Search Dialog */}
             <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );

    return (
        <div className="p-3 md:p-5 bg-white min-h-screen dark:bg-[#090e19] border-r border-gray-100 dark:border-neutral-800 h-full">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger>
                        <div className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                            <MenuIcon className="text-gray-700 dark:text-gray-200" size={24} />
                        </div>
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
export default Sidebar