"use client"
import { MenuIcon } from "lucide-react";
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

interface RoomDocument extends DocumentData {
    createdAt: string;
    role: "owner" | "editor"; //add a viewer later
    roomId: string;
    userId: string;
}

function Sidebar() {
    const { user } = useUser();
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
            where('userId', '==', user.emailAddresses[0].emailAddress)
        )
    );

    // Debug logging
    useEffect(() => {
        if (user) {
            console.log('User email:', user.emailAddresses[0].emailAddress);
            console.log('Data:', data?.docs?.length, 'documents');
            console.log('Loading:', loading);
            console.log('Error:', error);
            if (data?.docs) {
                data.docs.forEach(doc => {
                    console.log('Document data:', doc.data());
                });
            }
        }
    }, [user, data, loading, error]);

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
            <NewDocumentButton />
            <div className="flex py-4 flex-col space-y-4 md:max-w-36">
                {/*My Document List...*/}
                {loading && (
                    <h2 className="text-gray-500 font-semibold text-sm">
                        Loading documents...
                    </h2>
                )}
                {error && (
                    <h2 className="text-red-500 font-semibold text-sm">
                        Error: {error.message}
                    </h2>
                )}
                {!loading && !error && groupedData.owner.length === 0 ? (
                    <h2 className="text-gray-500 font-semibold text-sm">
                        No Documents found
                    </h2>
                ) : (
                    !loading && !error && (
                        <>
                            <h2 className="text-gray-500 font-semibold text-sm">
                                My Documents ({groupedData.owner.length})
                            </h2>
                            {groupedData.owner.map((doc) => (
                                <SidebarOption key={doc.id} id={doc.id} href={`/doc/${doc.id}`} />
                            ))}
                        </>
                    )
                )}

                {/*Shared with Me*/}
                {!loading && !error && groupedData.editor.length > 0 && (
                    <>
                        <h2 className="text-gray-500 font semibold text-sm">
                            Shared with Me ({groupedData.editor.length})
                        </h2>
                        {groupedData.editor.map((doc) => (
                            <SidebarOption key={doc.id} id={doc.id} href={`/doc/${doc.id}`} />
                        ))}
                    </>

                )}
            </div>
        </>
    );

    return (
        <div className="p-2 md:p-5 bg-gray-200 relative">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger>
                        <MenuIcon className="p-2 hover:opacity-30 rounded-lg" size={40} />
                    </SheetTrigger>
                    <SheetContent side='left'>
                        <SheetHeader>
                            <SheetTitle>Menu</SheetTitle>
                            <div>
                                {menuOptions}
                            </div>

                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden md:inline">
                {menuOptions}
            </div>
        </div>
    );
}
export default Sidebar