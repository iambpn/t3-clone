import { error } from "console";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  models: defineTable({
    name: v.string(),
    modelId: v.string(),
    capabilities: v.object({
      vision: v.boolean(),
      reasoning: v.boolean(),
    }),
  }).index("by_model_id", ["modelId"]),
  conversations: defineTable({
    title: v.string(),
    userId: v.string(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_conversation_user", ["userId"])
    .index("by_conversation_user_updatedAt", ["userId", "updatedAt"]),
  messages: defineTable({
    conversationId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    reasoningContent: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_conversation_id", ["conversationId"]),
});
