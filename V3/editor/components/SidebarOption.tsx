'use client'

import { db } from "@/firebase";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { FileTextIcon } from "lucide-react";
import { memo } from "react";

const SidebarOption = memo(function SidebarOption({ href, id, isExpanded }: {
    href: string;
    id: string;
    isExpanded: boolean;
}) {
    const [data] = useDocument(doc(db, "documents", id));
    const pathname = usePathname();
    const router = useRouter();
    const isActive = href.includes(pathname) && pathname !== "/";

    // Prefetch document on hover for instant navigation
    const handleMouseEnter = () => {
        router.prefetch(href);
    };

    if (!data) return null;

    const title = data.data()?.title || "";
    const truncatedTitle = title.length > 20 ? title.substring(0, 20) + "..." : title;

    return (
        <Link
            href={href}
            onMouseEnter={handleMouseEnter}
            prefetch={true}
            className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ease-in-out
                ${isActive
                    ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-900"}
                ${!isExpanded ? "justify-center" : ""}
            `}
            title={!isExpanded ? title : ""}
        >
            <FileTextIcon className="w-4 h-4 flex-shrink-0" />
            {isExpanded && <p className="truncate text-sm leading-tight max-w-[180px]">{truncatedTitle}</p>}
        </Link>
    )
})

export default SidebarOption