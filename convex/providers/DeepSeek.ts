import type { DataModel } from "convex/_generated/dataModel";
import { SystemPrompt } from "convex/constants/systemPrompt";
import OpenAI from "openai";

const deepseekClient = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

type PromptMessages = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function generateChatResponse(messages: PromptMessages[], modelId: string) {
  try {
    const response = await deepseekClient.chat.completions.create({
      model: modelId,
      reasoning_effort: "medium",
      messages: [SystemPrompt, ...messages],
      max_completion_tokens: 10000,
      temperature: 0.7,
    });

    const finishedReason = response.choices[0]?.finish_reason;

    const reasoning_content = (response.choices[0].message as any).reasoning_content || null;

    let content = "";
    let errorMessage = "";

    switch (finishedReason) {
      case "stop":
        {
          content = response.choices[0]?.message?.content || "";
        }
        break;
      case "length":
        {
          console.warn("Response truncated due to length limit.");
          content = response.choices[0]?.message?.content || "";
        }
        break;
      case "content_filter":
        {
          console.warn("Response filtered due to content policy violations.");
          errorMessage = "Sorry, I cannot provide a response that violates content policies.";
        }
        break;
      case "tool_calls":
        {
          console.warn("Response included tool calls, which are not supported in this context.");
          errorMessage = "Sorry, I cannot provide a response that includes tool calls.";
        }
        break;
      case "insufficient_system_resource" as any:
        {
          console.warn("Insufficient system resources to complete the request.");
          errorMessage = "Sorry, I cannot process your request at this time due to system resource limitations.";
        }
        break;
      default:
        console.warn("Unknown finish reason:", finishedReason);
        content = response.choices[0]?.message?.content || "";
    }

    return {
      content,
      errorMessage,
      finishedReason,
      reasoning_content,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      switch (error.code) {
        case "invalid_request_error":
          console.error("Invalid request error:", error.message);
          return {
            content: "",
            errorMessage: "Invalid request. Please check your input and try again.",
          };
        case "unauthorized":
          console.error("Unauthorized error:", error.message);
          return {
            content: "",
            errorMessage: "Unauthorized access. Please check your API key and permissions.",
          };
        case "rate_limit_exceeded":
          console.error("Rate limit exceeded error:", error.message);
          return {
            content: "",
            errorMessage: "Rate limit exceeded. Please try again later.",
          };
        case "server_error":
          console.error("Server error:", error.message);
          return {
            content: "",
            errorMessage: "Server error. Please try again later.",
          };
        default:
          console.error("Unknown error:", error.message);
          return {
            content: "",
            errorMessage: "An unknown error occurred. Please try again later.",
          };
      }
    }

    console.error("Error generating text with DeepSeek:", error);
    return {
      content: "",
      errorMessage: "An error occurred while generating the response. Please try again later.",
    };
  }
}
