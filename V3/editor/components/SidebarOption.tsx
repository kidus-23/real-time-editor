'use client'

import { db } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";

function SidebarOption({ href, id }: {
    href: string;
    id: string;
}) {
    const [data, loading, error] = useDocument(doc(db, "documents", id));
    const pathname = usePathname();
    const isActive = href.includes(pathname) && pathname !== "/";

    console.log("SidebarOption - href:", href, "id:", id, "pathname:", pathname);

    if (!data) return null;

    console.log("SidebarOption - Document data:", data.data());

    return (
        <Link href={href} className={`border p-2 rounded-md 
            ${isActive ? "bg-gray-300 font-bold border-black" : "border-gray-400"}`}
            onClick={() => console.log("SidebarOption - Clicked link to:", href)}
        >
            <p className="truncate">{data.data()?.title}</p>
        </Link>
    )
}

export default SidebarOption