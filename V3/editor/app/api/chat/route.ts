import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { messages, model } = await req.json();

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://real-time-editor.com', // Update with your site URL
                'X-Title': 'Real-time Editor',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages.map(({ role, content }: { role: string, content: string }) => ({
                    role: role === 'user' ? 'user' : 'assistant',
                    content,
                })),
                temperature: 0.7,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get response');
        }

        const data = await response.json();
        return NextResponse.json({
            response: data.choices[0].message.content,
            model: data.model,
            usage: data.usage
        });
    } catch (error: any) {
        console.error('Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred while processing your request' },
            { status: 500 }
        );
    }
}