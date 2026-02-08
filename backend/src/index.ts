import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { trackGemini } from "opik-gemini";
import { Opik } from "opik";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing");
}

// 1. Initialize Base Clients
const opikClient = new Opik();
const baseGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// We use "gemini-2.0-flash" or "gemini-1.5-flash" depending on what you have access to
const MODEL_NAME = "gemini-2.5-flash"; 

// --- HELPER: Evaluation Metric (LLM-as-a-Judge) ---
async function evaluateClarity(term: string, explanation: string, parentTrace: any): Promise<number> {
  try {
    // We create a specific tracked client for this sub-task to link it to the parent
    const evalGenAI = trackGemini(baseGenAI, {
      client: opikClient,
      parent: parentTrace,
      generationName: "clarity_evaluation",
      traceMetadata: { tags: ["evaluation"] }
    });

    const result = await evalGenAI.models.generateContent({
      model: MODEL_NAME,
      contents: `
        Rate the following explanation on a scale from 0.0 to 1.0 based on how simple and beginner-friendly it is.
        0.0 = Very complex, jargon-heavy.
        1.0 = Extremely simple, like explaining to a 5-year-old.
        
        Term: "${term}"
        Explanation: "${explanation}"
        
        Return ONLY the number.
      `
    });
    
    const scoreText = result.text?.trim() || "0.5";
    const score = parseFloat(scoreText);
    return isNaN(score) ? 0.5 : score;
  } catch (e) {
    console.error("Eval error", e);
    return 0; 
  }
}

// --- ROUTE: Explain Selection ---
app.post("/explain", async (req, res) => {
  // 1. Start a manual Opik Trace for the HTTP Request
  const trace = opikClient.trace({
    name: "explain_financial_term",
    input: req.body,
    tags: ["extension-backend", "finance", "explain"],
    metadata: { user_id: req.body.user_id || "anonymous" },
  });

  try {
    const { text, context } = req.body;

    if (!text || typeof text !== "string") {
      throw new Error("Missing or invalid text");
    }

    const safeContext = context && context.trim().length > 0 ? context : "No additional context.";

    const prompt = `
      You are a financial literacy assistant.
      Explain the selected financial term in very simple language.
      Rules: Beginner friendly, Max 80 words, No investment advice, Use one real-world example.
      Selected text: "${text}"
      Context: "${safeContext}"
    `;

    // 2. Create a tracked Gemini client linked to the HTTP trace
    const reqGenAI = trackGemini(baseGenAI, {
      client: opikClient,
      parent: trace, // Hierarchical visualization: This LLM call is a child of the HTTP trace
      generationName: "generate_explanation",
      traceMetadata: { tags: ["content-generation"] }
    });

    // 3. Call Gemini (New SDK syntax)
    const result = await reqGenAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const explanation = result.text || "I'm unsure how to explain this clearly.";

    // 4. Run Evaluation (Clarity Check)
    const clarityScore = await evaluateClarity(text, explanation, trace);

    // Log the metric to the trace
    trace.score({
      name: "clarity_metric",
      value: clarityScore,
      reason: "Automated heuristic via Gemini",
    });

    // 5. Update and End Trace
    trace.update({ output: { explanation, clarityScore } });
    trace.end();
    await reqGenAI.flush(); // Ensure logs are sent

    res.json({
      explanation: explanation.trim(),
      traceId: trace.data.id, 
    });

  } catch (error: any) {
    console.error("Gemini error:", error);
    trace.update({
      errorInfo: { exceptionType: "Error", message: error.message, traceback: "" },
    });
    trace.end();
    res.status(500).json({ explanation: "Sorry, I couldn't explain this right now." });
  }
});

// --- ROUTE: Chat (FIXED) ---
app.post("/chat", async (req, res) => {
  const trace = opikClient.trace({
    name: "finance_chat",
    input: req.body,
    tags: ["extension-backend", "finance", "chat"],
  });

  try {
    const { message, history } = req.body; // history is [{ role: 'user', parts: [{text: '...'}] }]

    // Validate history format for @google/genai
    // The extension sends: { role: 'user'|'model', parts: [{ text: '' }] }
    // The new SDK expects standard structure, usually this matches well, 
    // but strictly 'model' role is correct (Gemini 1.5+ uses 'user'/'model').
    
    // Create tracked client linked to this chat trace
    const chatGenAI = trackGemini(baseGenAI, {
      client: opikClient,
      parent: trace,
      generationName: "chat_turn",
    });

    // Prepare contents: History + New Message
    // Note: In a real app, you might maintain a ChatSession. 
    // Here we act stateless and feed full history every time.
    const contents = [
      ...(history || []),
      { role: "user", parts: [{ text: message }] }
    ];

    const result = await chatGenAI.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        temperature: 0.7, // Optional config
      }
    });

    const reply = result.text || "I didn't get a response.";

    trace.update({ output: { reply } });
    trace.end();
    await chatGenAI.flush();

    res.json({ reply });

  } catch (error: any) {
    console.error("Chat error:", error);
    trace.update({
      errorInfo: { exceptionType: "Error", message: error.message, traceback: "" },
    });
    trace.end();
    res.status(500).json({ reply: "Sorry, something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`✨ Opik Tracing & Gemini 2.0 Integration Active`);
});