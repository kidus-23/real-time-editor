import { auth } from "@clerk/nextjs/server";
import RoomProvider from "@/components/RoomProvider";

async function DocLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    if (!id || id.trim() === '') {
        throw new Error("Document ID is required");
    }

    return <RoomProvider roomId={id}>{children}</RoomProvider>
}

export default DocLayout;
