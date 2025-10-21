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

        const prompt = `Analyze the following document content and extract exactly 3 most relevant tags.

Rules:
1. Respond ONLY with a valid JSON array containing exactly 3 string tags
2. Each tag should be a single word or short phrase (2-3 words maximum)
3. Tags should represent the main topics, themes, or concepts
4. Do not include any explanations, markdown, or additional text
5. Format must be exactly: ["tag1","tag2","tag3"]

Example valid response: ["web development","react hooks","typescript"]

Document content to analyze: ${content}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Parse the response as JSON
        try {
            // First clean any potential markdown or extra whitespace
            const cleanedText = text
                .replace(/```json\s*|```\s*/g, '')  // Remove code blocks
                .replace(/[\n\r\t]/g, '')           // Remove newlines and tabs
                .trim();
                
            // Ensure the text starts with [ and ends with ]
            if (!cleanedText.startsWith('[') || !cleanedText.endsWith(']')) {
                throw new Error("Response is not in the expected JSON array format");
            }
            
            const tags = JSON.parse(cleanedText);
            
            if (!Array.isArray(tags)) {
                throw new Error("Response is not an array");
            }

            // Validate tags
            if (tags.length !== 3) {
                throw new Error("Expected exactly 3 tags");
            }

            // Ensure all items are strings and clean them
            const cleanedTags = tags
                .map(tag => String(tag).trim())
                .filter(tag => tag.length > 0);

            if (cleanedTags.length !== 3) {
                throw new Error("Invalid tags received");
            }
            
            return NextResponse.json({ 
                success: true,
                tags: cleanedTags
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