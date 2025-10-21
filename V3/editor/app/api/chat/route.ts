import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS } from "@/lib/constants";
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
    try {
        const { messages, model, documentContext, userApiKeys } = await req.json();

        // Basic validation
        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Missing messages array in request' }, { status: 400 });
        }

        // If document context is provided, add it to the messages
        let chatMessages = [...messages];

        if (documentContext) {
            // Add document context as a system message at the beginning
            chatMessages.unshift({
                role: "system",
                content: `The following is a document that the user is asking about. Use this document to answer the user's questions:\n\n${documentContext}\n\nAnswer questions based on the document content above.`
            });
        }

        // Validate model is supported by our UI list
        const supportedModels = new Set([
            ...Object.keys(AI_MODELS.GEMINI),
            ...Object.keys(AI_MODELS.OPENAI)
        ])

        if (!model || !supportedModels.has(model)) {
            return NextResponse.json({
                error: `Unsupported model '${model}'. Supported models: ${Array.from(supportedModels).join(', ')}`
            }, { status: 400 })
        }

        // Use user's API keys object if provided
        const userKeys = userApiKeys || null

        // If model belongs to Gemini group, use GoogleGenerativeAI and gemini key
        if (Object.keys(AI_MODELS.GEMINI).includes(model)) {
            // Try user's API key first, fall back to environment variable
            const geminiKey = userKeys?.gemini || process.env.GOOGLE_AI_API_KEY;
            if (!geminiKey) {
                return NextResponse.json({ 
                    error: 'No Gemini API key found. Please add your API key in settings or contact the administrator.' 
                }, { status: 401 });
            }

            try {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const genModel = genAI.getGenerativeModel({ model: model });
                const prompt = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n');
                const result = await genModel.generateContent(prompt);
                const responseText = await (await result.response).text();

                return NextResponse.json({ 
                    response: responseText, 
                    model,
                    usage: { total_tokens: 0 } // Gemini doesn't provide token counts yet
                });
            } catch (error: any) {
                console.error('Gemini API Error:', error);
                throw new Error(error?.message || 'Failed to get response from Gemini API');
            }
        }

        // Otherwise assume OpenRouter-compatible (OpenAI-like) usage
        // Try user's API key first, fall back to environment variable
        const openrouterKey = userKeys?.openrouter || process.env.OPENROUTER_API_KEY;

        if (!openrouterKey) {
            return NextResponse.json(
                { error: 'No OpenRouter API key found. Please add your API key in settings or contact the administrator.' },
                { status: 401 }
            );
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'HTTP-Referer': 'https://real-time-editor.com', // Update with your site URL
                'X-Title': 'Real-time Editor',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: chatMessages.map(({ role, content }: { role: string, content: string }) => ({
                    role: role === 'user' ? 'user' : role === 'system' ? 'system' : 'assistant',
                    content,
                })),
                temperature: 0.7,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            // Try to parse the response body safely and extract a useful message
            let bodyText: string | null = null
            let parsed: any = null
            try {
                bodyText = await response.text()
                parsed = bodyText ? JSON.parse(bodyText) : null
            } catch (e) {
                // Not JSON
                parsed = null
            }

            // Look for common error shapes
            const message = parsed?.message || parsed?.error?.message || parsed?.detail || bodyText || `HTTP ${response.status}`

            console.error('Upstream API error', { status: response.status, body: parsed ?? bodyText })
            throw new Error(message || 'Failed to get response from upstream API')
        }

        // Parse success body (may still be non-JSON; handle gracefully)
        let data: any
        try {
            data = await response.json()
        } catch (e) {
            const text = await response.text()
            console.error('Failed to parse JSON from upstream API:', text)
            throw new Error('Invalid response from upstream API')
        }

        // Defensive checks for expected shape
        const choice = data?.choices?.[0]
        const assistantMessage = choice?.message?.content ?? choice?.text ?? null

        if (!assistantMessage) {
            console.error('Unexpected upstream response shape', data)
            throw new Error('Upstream API returned unexpected response')
        }

        return NextResponse.json({
            response: assistantMessage,
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