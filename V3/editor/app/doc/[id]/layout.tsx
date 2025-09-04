import { auth } from "@clerk/nextjs/server";
import RoomProvider from "@/components/RoomProvider";

async function DocLayout({ children, params }: {children: React.ReactNode; params: {id: string}}) {
    const { id } = await params;

    const { userId } = await auth();
    if (!userId) {
        // You can throw an error or redirect, depending on your needs
        throw new Error("Unauthorized");
    }

    return <RoomProvider roomId={id}> {children} </RoomProvider>
} 

export default DocLayout;
