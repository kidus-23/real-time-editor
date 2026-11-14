import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateTagsFromContent } from "@/lib/tagGeneration";

export async function POST(req: NextRequest) {
    try {
        // Auth gate: this endpoint can burn the server's paid AI quota.
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, userApiKey } = await req.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: "No content provided"
            }, { status: 400 });
        }

        const tags = await generateTagsFromContent(content, userApiKey);

        return NextResponse.json({
            success: true,
            tags
        });
    } catch (error) {
        console.error('Tag Generation Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate tags' },
            { status: 500 }
        );
    }
}
