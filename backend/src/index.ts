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

// Helper to access Opik HTTP API directly for feedback scores
const OPIK_API_KEY = process.env.OPIK_API_KEY || "";
const OPIK_API_BASE =
  process.env.OPIK_URL_OVERRIDE || "https://www.comet.com/opik/api";

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

// --- HELPER: Guardrail - Detect Financial Advice ---
async function detectFinancialAdvice(
  content: string,
  parentTrace: any
): Promise<{ isAdvice: boolean; reason: string }> {
  try {
    const guardrailGenAI = trackGemini(baseGenAI, {
      client: opikClient,
      parent: parentTrace,
      generationName: "financial_advice_guardrail",
      traceMetadata: { tags: ["guardrail", "compliance"] },
    });

    const result = await guardrailGenAI.models.generateContent({
      model: MODEL_NAME,
      contents: `
        You are a compliance classifier.
        Your job is to detect if a message gives *actionable financial advice*,
        such as telling someone to buy/sell/hold a specific asset, or making
        strong recommendations about timing (e.g., "Buy Bitcoin now").

        Message:
        """
        ${content}
        """

        Respond in JSON with the following shape and nothing else:
        {
          "is_advice": true | false,
          "reason": "short human-readable explanation"
        }
      `,
    });

    const text = result.text?.trim() || "";
    let isAdvice = false;
    let reason = "Guardrail classification unavailable";

    try {
      const parsed = JSON.parse(text);
      isAdvice = !!parsed.is_advice;
      reason = typeof parsed.reason === "string" ? parsed.reason : reason;
    } catch {
      // Fallback heuristic if JSON parsing fails
      const lower = content.toLowerCase();
      const hasImperative =
        lower.includes("buy ") ||
        lower.includes("buying ") ||
        lower.includes("sell ") ||
        lower.includes("selling ") ||
        lower.includes("you should invest") ||
        lower.includes("i recommend you invest") ||
        lower.includes("now is a good time to buy") ||
        lower.includes("now is the time to buy") ||
        lower.includes("load up on");
      isAdvice = hasImperative;
      reason = hasImperative
        ? "Heuristic detected imperative investment language."
        : reason;
    }

    // Log guardrail score on the parent trace
    parentTrace.score({
      name: "guardrail_financial_advice",
      value: isAdvice ? -1 : 1,
      reason,
    });

    return { isAdvice, reason };
  } catch (e) {
    console.error("Guardrail error", e);
    return { isAdvice: false, reason: "Guardrail error" };
  }
}

// --- HELPER: Add User Feedback Score to Trace in Opik ---
async function addUserFeedbackToTrace(params: {
  traceId: string;
  vote: "up" | "down";
  source: "overlay" | "sidebar";
}) {
  const { traceId, vote, source } = params;

  if (!OPIK_API_KEY) {
    console.warn("OPIK_API_KEY is not set; skipping feedback logging.");
    return;
  }

  const value = vote === "up" ? 1 : -1;

  try {
    // Opik REST API: POST /api/v1/private/traces/:id/feedback_scores
    // (OPIK_API_BASE already ends with `/api` in cloud config)
    const url = `${OPIK_API_BASE}/v1/private/traces/${traceId}/feedback_scores`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPIK_API_KEY}`,
      },
      body: JSON.stringify({
        name: "user_feedback",
        value,
        source: "online_scoring",
        category_name: source,
        reason:
          vote === "up"
            ? "User gave a thumbs up from browser extension."
            : "User gave a thumbs down from browser extension.",
      }),
    });

    if (!response.ok) {
      console.error(
        "Failed to send feedback score to Opik",
        response.status,
        await response.text()
      );
    }
  } catch (e) {
    console.error("Error sending feedback score to Opik", e);
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

    const rawExplanation = result.text || "I'm unsure how to explain this clearly.";

    // 4. Guardrail: ensure no financial advice
    const guardrail = await detectFinancialAdvice(rawExplanation, trace);
    const explanation = guardrail.isAdvice
      ? "I can't provide specific investment advice. Instead, I can explain general financial concepts and risks so you can make your own informed decisions."
      : rawExplanation;

    // 5. Run Evaluation (Clarity Check)
    const clarityScore = await evaluateClarity(text, explanation, trace);

    // Log the metric to the trace
    trace.score({
      name: "clarity_metric",
      value: clarityScore,
      reason: "Automated heuristic via Gemini",
    });

    // 6. Update and End Trace (also storing guardrail info)
    trace.update({
      output: { explanation, clarityScore },
      metadata: {
        guardrail_financial_advice: guardrail,
      },
    });
    trace.end();
    await reqGenAI.flush(); // Ensure logs are sent

    res.json({
      explanation: explanation.trim(),
      traceId: trace.data.id, 
      guardrail,
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

    const rawReply = result.text || "I didn't get a response.";

    // Guardrail: ensure no financial advice in chat replies
    const guardrail = await detectFinancialAdvice(rawReply, trace);
    const reply = guardrail.isAdvice
      ? "I’m not able to give specific investment or trading advice like telling you what to buy or sell. I can help explain financial concepts, tools, and typical risks so you can make your own decisions."
      : rawReply;

    trace.update({
      output: { reply },
      metadata: {
        guardrail_financial_advice: guardrail,
      },
    });
    trace.end();
    await chatGenAI.flush();

    res.json({ reply, traceId: trace.data.id, guardrail });

  } catch (error: any) {
    console.error("Chat error:", error);
    trace.update({
      errorInfo: { exceptionType: "Error", message: error.message, traceback: "" },
    });
    trace.end();
    res.status(500).json({ reply: "Sorry, something went wrong." });
  }
});

// --- ROUTE: User Feedback (Thumbs Up / Down) ---
app.post("/feedback", async (req, res) => {
  const { traceId, vote, source } = req.body || {};

  if (!traceId || (vote !== "up" && vote !== "down")) {
    return res.status(400).json({ error: "traceId and vote are required." });
  }

  const normalizedSource =
    source === "overlay" || source === "sidebar" ? source : "overlay";

  try {
    await addUserFeedbackToTrace({
      traceId,
      vote,
      source: normalizedSource,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("Error handling /feedback request", e);
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`✨ Opik Tracing & Gemini 2.0 Integration Active`);
});