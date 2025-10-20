import Document from "@/components/Document";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Loading component for better perceived performance
function DocumentSkeleton() {
    return (
        <div className="flex flex-col flex-1 min-h-screen animate-pulse">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
            </div>
            <div className="flex-1 p-8 space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
        </div>
    );
}

async function DocumentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="flex flex-col flex-1 min-h-screen">
            <Suspense fallback={<DocumentSkeleton />}>
                <Document id={id} />
            </Suspense>
        </div>
    );
}

export default DocumentPage