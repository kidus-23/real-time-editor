import OpenAI from "openai";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  Open_AI_KEY: string;
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["X-Custom-Header", "Content-Type", "Upgrade-Insecure-Requests"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  })
);

app.post('/translateDocument', async (c) => {
  try {
    const { documentData, targetLang } = await c.req.json();

    if (!documentData || !targetLang) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate summary
    const summaryresponse = await c.env.AI.run('@cf/facebook/bart-large-cnn', {
      input_text: documentData,
      max_length: 1000,
    });

    const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
      text: summaryresponse.summary,
      source_lang: 'en',
      target_lang: targetLang
    });

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ error: "Failed to process translation request" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

app.post('/evaluateAnswer', async (c) => {
  try {
    const { question, userAnswer, correctAnswer, questionType, documentData } = await c.req.json();

    if (!question || !userAnswer || !correctAnswer || !questionType) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let evaluation;

    if (questionType === "trueFalse" || questionType === "multipleChoice") {
      // For true/false and multiple choice, do case-insensitive comparison
      const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      evaluation = {
        isCorrect,
        explanation: isCorrect
          ? "Correct! Well done."
          : `Incorrect. The correct answer is: ${correctAnswer}`
      };
    } else if (questionType === "shortAnswer") {
      // For short answers, use AI to evaluate
      const openai = new OpenAI({
        apiKey: c.env.Open_AI_KEY,
      });

      const prompt = `You are evaluating a student's answer to a question based on document content.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Document Context: ${documentData || 'N/A'}

Please evaluate the student's answer and provide:
1. A score from 0-10 (10 being perfect)
2. Whether it should be considered correct (score >= 7)
3. A brief explanation of why the answer is correct or incorrect

Respond in JSON format: {"score": number, "isCorrect": boolean, "explanation": string}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      evaluation = JSON.parse(response.choices[0].message.content || '{"score": 0, "isCorrect": false, "explanation": "Failed to evaluate"}');
    }

    return new Response(JSON.stringify({ evaluation }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(JSON.stringify({ error: "Failed to evaluate answer" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Export the fetch handler for the Cloudflare Worker
export default app;
