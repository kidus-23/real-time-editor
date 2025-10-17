import Document from "@/components/Document";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function DocumentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div
            className="flex flex-col flex-1 min-h-screen"
        >
            <Document id={id} />
        </div>
    );
}

export default DocumentPage