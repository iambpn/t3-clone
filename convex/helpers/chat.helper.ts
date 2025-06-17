import { FinishReason, type GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import { ModelType } from "../constants/model";
import { SystemPrompt } from "../constants/systemPrompt";
import { DeepseekClient } from "../providers/DeepSeek";
import { GeminiClient } from "../providers/Gemini";
import type { ModelArgType } from "../types";

type PromptMessages = {
  role: "user" | "assistant" | "system";
  content: string;
};

type LLMResponse = {
  content: string;
  errorMessage: string;
  isComplete: boolean;
  finishedReason?: string | null;
  reasoning_content?: string | null;
};

export function generateLLMResponse(messages: PromptMessages[], model: ModelArgType) {
  try {
    switch (model.type) {
      case ModelType.Google:
        return generateGeminiChatResponse(GeminiClient, messages, model);
      case ModelType.Deepseek:
        return generateOpenAIChatResponse(DeepseekClient, messages, model);
      default:
        return `Unsupported model type: ${model.type}`;
    }
  } catch (error) {
    console.error("Error generating LLM response:", error);
    return "An error occurred while generating the response. Please try again later.";
  }
}

async function* generateOpenAIChatResponse(
  client: OpenAI,
  messages: PromptMessages[],
  model: ModelArgType
): AsyncGenerator<LLMResponse> {
  try {
    const response = await client.chat.completions.create({
      model: model.modelId,
      reasoning_effort: "medium",
      messages: [SystemPrompt, ...messages],
      max_completion_tokens: 25000,
      temperature: 0.5,
      stream: true,
    });

    let content = "";
    let errorMessage = "";
    let reasoning_content = "";

    for await (const chunk of response) {
      const finishedReason = chunk.choices[0]?.finish_reason;

      reasoning_content = (chunk.choices[0].delta as any).reasoning_content || null;

      switch (finishedReason) {
        case "stop":
        case null:
          {
            content += chunk.choices[0]?.delta?.content || "";
          }
          break;
        case "length":
          {
            console.warn("Response truncated due to length limit.");
            content += chunk.choices[0]?.delta?.content || "";
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
          content += chunk.choices[0]?.delta?.content || "";
      }

      yield {
        content,
        errorMessage,
        finishedReason,
        reasoning_content,
        isComplete: finishedReason !== null,
      };
    }
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      switch (error.code) {
        case "invalid_request_error":
          console.error("Invalid request error:", error.message);
          yield {
            content: "",
            errorMessage: "Invalid request. Please check your input and try again.",
            isComplete: true,
          };
          break;
        case "unauthorized":
          console.error("Unauthorized error:", error.message);
          yield {
            content: "",
            errorMessage: "Unauthorized access. Please check your API key and permissions.",
            isComplete: true,
          };
          break;
        case "rate_limit_exceeded":
          console.error("Rate limit exceeded error:", error.message);
          yield {
            content: "",
            errorMessage: "Rate limit exceeded. Please try again later.",
            isComplete: true,
          };
          break;
        case "server_error":
          console.error("Server error:", error.message);
          yield {
            content: "",
            errorMessage: "Server error. Please try again later.",
            isComplete: true,
          };
          break;
        default:
          console.error("Unknown error:", error.message);
          yield {
            content: "",
            errorMessage: "An unknown error occurred. Please try again later.",
            isComplete: true,
          };
      }
      return;
    }

    console.error("Error generating text with DeepSeek:", error);
    yield {
      content: "",
      errorMessage: "An error occurred while generating the response. Please try again later.",
      isComplete: true,
    };
  }
}

async function* generateGeminiChatResponse(
  client: GoogleGenAI,
  messages: PromptMessages[],
  model: ModelArgType
): AsyncGenerator<LLMResponse> {
  try {
    const thinkingParams = {
      thinkingConfig: {
        includeThoughts: true,
        thinkingBudget: 1024,
      },
    };

    const response = await client.models.generateContentStream({
      contents: messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      model: model.modelId,
      config: {
        systemInstruction: SystemPrompt.content,
        maxOutputTokens: 25000,
        temperature: 0.5,
        ...(model.capabilities.reasoning ? thinkingParams : {}),
      },
    });

    let content = "";
    let reasoning_content = "";

    for await (const chunk of response) {
      const finishedReason = chunk.candidates?.at(0)?.finishReason || null;

      switch (finishedReason) {
        case FinishReason.MAX_TOKENS:
          {
            console.warn("Response truncated due to length limit.", {
              finishedMessage: chunk.candidates?.at(0)?.finishMessage,
            });
            for (const part of chunk.candidates?.at(0)?.content?.parts || []) {
              if (!part.text) {
                continue;
              } else if (part.thought) {
                reasoning_content += part.text;
              } else {
                content += part.text;
              }
            }
          }
          break;
        case FinishReason.STOP:
        case null:
          {
            for (const part of chunk.candidates?.at(0)?.content?.parts || []) {
              if (!part.text) {
                continue;
              } else if (part.thought) {
                reasoning_content += part.text;
              } else {
                content += part.text;
              }
            }
          }
          break;
        default:
          console.warn("Finish due to abnormal reasons:", finishedReason);
          yield {
            content: "",
            errorMessage:
              chunk.candidates?.at(0)?.finishMessage || "An unexpected error occurred while generating the response.",
            isComplete: true,
          };
      }

      yield {
        content,
        errorMessage: "",
        finishedReason: chunk.candidates?.at(0)?.finishReason || null,
        reasoning_content,
        isComplete: chunk.candidates?.at(0)?.finishReason !== null,
      };
    }
  } catch (error) {
    console.error("Error generating Gemini chat response:", error);
    yield {
      content: "",
      errorMessage: "An error occurred while generating the response. Please try again later.",
      isComplete: true,
    };
  }
}
