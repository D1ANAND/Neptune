import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

app.post("/explain", async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid text" });
    }

    const safeContext =
      typeof context === "string" && context.trim().length > 0
        ? context
        : "No additional context provided.";

    const prompt = `
You are a financial literacy assistant.

Explain the selected financial term in very simple language.

Rules:
- Beginner friendly
- Max 80 words
- No investment advice
- Use one real-world example
- If unsure, say you are unsure

Selected text:
"${text}"

Context:
"${safeContext}"
`;

    const result = await model.generateContent(prompt);

    const explanation =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I'm unsure how to explain this clearly.";

    res.json({
      explanation: explanation.trim()
    });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      explanation: "Sorry, I couldn't explain this right now."
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
