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
    allowHeaders: ["X-Custom-Header","Content-Type", "Upgrade-Insecure-Requests"],
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

// Export the fetch handler for the Cloudflare Worker
export default app;
