import { v } from "convex/values";
import { ModelType } from "./constants/model";

export const ModelArg = v.object({
  name: v.string(),
  modelId: v.string(),
  type: v.union(v.literal(ModelType.Google), v.literal(ModelType.Deepseek)),
  capabilities: v.object({
    reasoning: v.boolean(),
    vision: v.boolean(),
  }),
});

export type ModelArgType = typeof ModelArg.type;

export type ChatRoles = "user" | "assistant" | "system";