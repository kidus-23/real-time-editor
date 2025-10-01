import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { content } = await req.json();
        
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ 
                success: false,
                error: "No content provided" 
            }, { status: 400 });
        }
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.2, // Lower temperature for more consistent tags
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        const prompt = `Extract exactly 3 most important and relevant tags from the following document content.
        Focus on the main themes and concepts.
        Return ONLY a JSON array of 3 strings with no explanation or other text.
        Make tags specific, concise, and highly relevant to the core topics.
        Example response format: ["tag1", "tag2", "tag3"]
        
        Document content: ${content}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Parse the response as JSON
        try {
            // Handle cases where the model might include markdown code blocks
            const cleanedText = text.replace(/```json\s*|```\s*/g, '');
            const tags = JSON.parse(cleanedText);
            
            if (!Array.isArray(tags)) {
                throw new Error("Response is not an array");
            }
            
            return NextResponse.json({ 
                success: true,
                tags: tags
            });
        } catch (parseError) {
            console.error('Failed to parse tags JSON:', parseError);
            return NextResponse.json({ 
                success: false,
                error: "Failed to parse tags from AI response",
                rawResponse: text
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Tag Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate tags' },
            { status: 500 }
        );
    }
}