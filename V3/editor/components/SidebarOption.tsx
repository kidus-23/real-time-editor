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

    if (!data) return null;

    return (
        <Link
            href={href}
            className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out truncate
                ${isActive
                    ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"}
            `}
        >
            <p className="truncate text-sm leading-tight">{data.data()?.title}</p>
        </Link>
    )
}

export default SidebarOption