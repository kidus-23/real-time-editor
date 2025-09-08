import { auth } from "@clerk/nextjs/server";
import RoomProvider from "@/components/RoomProvider";

async function DocLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>
}) {
    console.log("=== DocLayout [id] START ===");
    const { id } = await params;

    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    console.log("DocLayout [id] - Document ID:", id);
    console.log("DocLayout [id] - User ID:", userId);

    if (!id || id.trim() === '') {
        throw new Error("Document ID is required");
    }

    console.log("DocLayout [id] - About to render RoomProvider with roomId:", id);
    return <RoomProvider roomId={id}>{children}</RoomProvider>
}

export default DocLayout;
