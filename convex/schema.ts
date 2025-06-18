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
    type: v.union(v.literal("google"), v.literal("deepseek")),
  }).index("by_model_id", ["modelId"]),
  conversations: defineTable({
    title: v.string(),
    userId: v.string(),
    parentConversationId: v.optional(v.string()),
    splitFromMessageId: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_conversation_user", ["userId"])
    .index("by_conversation_user_updatedAt", ["userId", "updatedAt"])
    .index("by_conversation_user_parent_updatedAt", ["userId", "parentConversationId", "updatedAt"])
    .index("by_conversation_parent", ["parentConversationId"]),
  messages: defineTable({
    conversationId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    reasoningContent: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    completed: v.boolean(),
  }).index("by_conversation_id", ["conversationId"]),
  conversationSummaries: defineTable({
    conversationId: v.string(),
    summarizedContent: v.string(),
    errorMessage: v.optional(v.string()),
    completed: v.boolean(),
  }).index("by_conversation_id", ["conversationId"]),
});
