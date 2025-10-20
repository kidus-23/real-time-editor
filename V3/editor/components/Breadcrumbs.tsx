'use client'

import { usePathname } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

function Breadcrumbs() {
    const path = usePathname() || "/";
    const { t } = useTranslation();
    const [documentTitles, setDocumentTitles] = useState<Record<string, string>>({});

    // Keep original segments for building hrefs
    const originalSegments = path.split("/").filter(Boolean);

    // Fetch document titles for doc IDs
    useEffect(() => {
        const fetchDocumentTitles = async () => {
            const titles: Record<string, string> = {};

            for (let i = 0; i < originalSegments.length; i++) {
                const segment = originalSegments[i];

                // Check if this is a document ID (comes after "doc" segment)
                if (i > 0 && originalSegments[i - 1] === "doc") {
                    try {
                        const docRef = doc(db, "documents", segment);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            titles[segment] = docSnap.data()?.title || segment;
                        } else {
                            titles[segment] = segment;
                        }
                    } catch (error) {
                        console.error("Error fetching document title:", error);
                        titles[segment] = segment;
                    }
                }
            }

            setDocumentTitles(titles);
        };

        fetchDocumentTitles();
    }, [path]);

    // Map segments to display names with i18n support
    const getDisplayName = (segment: string, index: number) => {
        // Check if it's a document ID
        if (index > 0 && originalSegments[index - 1] === "doc" && documentTitles[segment]) {
            return documentTitles[segment];
        }

        // Translate known route segments
        const routeTranslations: Record<string, string> = {
            "doc": t("breadcrumbs.document"),
            "graph": t("breadcrumbs.graph"),
            "settings": t("breadcrumbs.settings"),
        };

        return routeTranslations[segment] || decodeURIComponent(segment.replace(/-/g, " "));
    };

    return (
        <Breadcrumb className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 overflow-hidden">
            <BreadcrumbItem>
                <BreadcrumbLink
                    href="/"
                    className="px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-900 transition"
                >
                    {t("breadcrumbs.home")}
                </BreadcrumbLink>
            </BreadcrumbItem>

            {originalSegments.map((segment, index) => {
                const href = `/${originalSegments.slice(0, index + 1).join("/")}`;
                const isLast = index === originalSegments.length - 1;
                const displayName = getDisplayName(segment, index);

                return (
                    <Fragment key={`${segment}-${index}`}>
                        <BreadcrumbSeparator className="text-gray-300 dark:text-neutral-700 flex items-center" />
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage className="font-medium text-gray-900 dark:text-white capitalize truncate px-1 py-0.5 max-w-[200px]">
                                    {displayName}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink
                                    href={href}
                                    className="px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-900 transition capitalize truncate max-w-[200px]"
                                >
                                    {displayName}
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                );
            })}
        </Breadcrumb>
    )
}
export default Breadcrumbs