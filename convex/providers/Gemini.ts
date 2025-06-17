import { GoogleGenAI } from "@google/genai";

export const GeminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
