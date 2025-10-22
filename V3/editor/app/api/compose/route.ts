import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { prompt, userApiKey } = await req.json();

        // Use user's API key if provided, otherwise fall back to environment variable
        const apiKey = userApiKey || process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'No API key provided. Please configure your Google Gemini API key in settings.' },
                { status: 401 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.3, // Lower temperature for more focused responses
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            success: true,
            response: text
        });
    } catch (error) {
        console.error('Compose Error:', error);
        return NextResponse.json(
            { error: 'Failed to process composition request' },
            { status: 500 }
        );
    }
}