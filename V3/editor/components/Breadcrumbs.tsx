'use client'

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react";

function Breadcrumbs() {
    const path = usePathname() || "/";
    // Keep original segments for building hrefs, and build display labels separately.
    const originalSegments = path.split("/").filter(Boolean); // removes empty entries
    const displaySegments = originalSegments.map((s) =>
        decodeURIComponent(s.replace(/-/g, " ")).replace(/\.[^/.]+$/, "") // replace hyphens, decode, strip file ext
    );

    return (
        <Breadcrumb className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 overflow-hidden">
            <BreadcrumbItem>
                <BreadcrumbLink
                    href="/"
                    className="px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-900 transition"
                >
                    Home
                </BreadcrumbLink>
            </BreadcrumbItem>

            {displaySegments.map((segment, index) => {
                const href = `/${originalSegments.slice(0, index + 1).join("/")}`;
                const isLast = index === displaySegments.length - 1;

                return (
                    <Fragment key={`${segment}-${index}`}>
                        <BreadcrumbSeparator className="text-gray-300 dark:text-neutral-700 flex items-center" />
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage className="font-medium text-gray-900 dark:text-white capitalize truncate px-1 py-0.5">
                                    {segment}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink
                                    href={href}
                                    className="px-1 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-neutral-900 transition capitalize truncate"
                                >
                                    {segment}
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