import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

export const getConversations = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return [];
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_conversation_user_updatedAt", (q) => q.eq("userId", user.subject))
      .order("desc")
      .collect();

    return conversations.map((conversation) => ({
      _id: conversation._id,
      title: conversation.title,
      userId: conversation.userId,
      updatedAt: conversation.updatedAt,
    }));
  },
});

export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;
    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversationId))
      .collect();

    return messages.map((message) => ({
      _id: message._id,
      role: message.role,
      content: message.content,
      conversationIds: message.conversationId,
    }));
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, content } = args;

    console.log(args);

    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError({ message: "You are not authenticated to send messages" });
    }

    if (!content) {
      throw new ConvexError({ message: "Message cannot be empty" });
    }

    let conversation: DataModel["conversations"]["document"] | null = null;
    if (conversationId) {
      conversation = await ctx.db
        .query("conversations")
        .filter((q) => q.eq(q.field("_id"), conversationId))
        .first();
    } else {
      // create a new conversation if no ID is provided
      const newConversationId = await ctx.runMutation(internal.chat.createConversation, {
        userId: user.subject,
      });

      conversation = await ctx.db.get(newConversationId);
    }

    if (!conversation) {
      throw new ConvexError({ message: "Conversation not found. Please try again" });
    }

    await ctx.db.insert("messages", {
      conversationId: conversation._id,
      role: "user",
      content,
    });
  },
});

export const createConversation = internalMutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, title } = args;

    if (!userId) {
      throw new Error("Title and User ID are required to create a conversation");
    }

    const newConversationId = await ctx.db.insert("conversations", {
      title: title || "New Conversation",
      userId,
      updatedAt: Date.now(),
    });

    return newConversationId;
  },
});
