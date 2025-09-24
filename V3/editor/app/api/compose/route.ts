import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();
        
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