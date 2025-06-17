import { paginationOptsValidator, type PaginationResult } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { generateLLMResponse } from "./helpers/chat.helper";
import { ModelArg } from "./types";

export const getConversations = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      return {
        continueCursor: "",
        isDone: true,
        page: [],
      } satisfies PaginationResult<never[]>;
    }

    const paginatedConversations = await ctx.db
      .query("conversations")
      .withIndex("by_conversation_user_updatedAt", (q) => q.eq("userId", user.subject))
      .order("desc")
      .paginate(paginationOpts);

    const transformedPage = paginatedConversations.page.map((conversation) => ({
      _id: conversation._id,
      title: conversation.title,
      userId: conversation.userId,
      updatedAt: conversation.updatedAt,
    }));

    return {
      ...paginatedConversations,
      page: transformedPage,
    };
  },
});

export const getConversationMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("You are not authenticated to view messages");
    }

    if (!conversationId) {
      throw new ConvexError("Conversation ID is required");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();

    return messages.map((message) => ({
      _id: message._id,
      role: message.role,
      content: message.content,
      reasoningContent: message.reasoningContent,
      errorMessage: message.errorMessage,
      conversationIds: message.conversationId,
      isCompleted: message.completed,
    }));
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    content: v.string(),
    modelId: v.id("models"),
  },
  handler: async (ctx, args): Promise<{ conversationId: string }> => {
    const { conversationId, content } = args;

    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError({ message: "You are not authenticated to send messages" });
    }

    if (!content) {
      throw new ConvexError({ message: "Message cannot be empty" });
    }

    let conversation: DataModel["conversations"]["document"] | null = null;
    let isNewConversation = false;
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
      isNewConversation = true;
    }

    if (!conversation) {
      throw new ConvexError({ message: "Conversation not found. Please try again" });
    }

    await ctx.db.insert("messages", {
      conversationId: conversation._id,
      role: "user",
      content,
      completed: true,
    });

    const model = await ctx.runQuery(internal.chat.getModelById, {
      modelId: args.modelId,
    });

    const messages = await ctx.runQuery(internal.chat.getMessagesForChat, {
      conversationId: conversation._id,
      lastN: 50,
    });

    // call the assistant api
    await ctx.scheduler.runAfter(0, internal.chat.askAssistant, {
      conversationId: conversation._id,
      model: {
        modelId: model.modelId,
        type: model.type,
        capabilities: model.capabilities,
        name: model.name,
      },
      userId: user.subject,
      messages,
    });

    if (isNewConversation) {
      // Set the title of the new conversation based on the first message
      await ctx.scheduler.runAfter(300, internal.chat.generateTitle, {
        conversationId: conversation._id,
        userContent: content,
      });
    }

    return { conversationId: conversation._id };
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;

    if (!conversationId) {
      throw new ConvexError({ message: "Conversation ID is required to delete a conversation" });
    }

    // Delete all messages associated with the conversation
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation itself
    await ctx.db.delete(conversationId);
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
      throw new ConvexError("Title and User ID are required to create a conversation");
    }

    const newConversationId = await ctx.db.insert("conversations", {
      title: title || "New Conversation",
      userId,
      updatedAt: Date.now(),
    });

    return newConversationId;
  },
});

export const getModelById = internalQuery({
  args: {
    modelId: v.id("models"),
  },
  handler: async (ctx, args) => {
    const { modelId } = args;

    if (!modelId) {
      throw new ConvexError({ message: "Model ID is required to fetch model details" });
    }

    const model = await ctx.db
      .query("models")
      .filter((q) => q.eq(q.field("_id"), modelId))
      .first();

    if (!model) {
      throw new ConvexError({ message: "Model not found" });
    }

    return model;
  },
});

export const getModelByModelId = internalQuery({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const { modelId } = args;

    if (!modelId) {
      throw new ConvexError({ message: "Model ID is required to fetch model details" });
    }

    const model = await ctx.db
      .query("models")
      .filter((q) => q.eq(q.field("modelId"), modelId))
      .first();

    if (!model) {
      throw new ConvexError({ message: "Model not found" });
    }

    return model;
  },
});

export const getMessagesForChat = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    lastN: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { conversationId, lastN } = args;

    if (!conversationId) {
      throw new ConvexError({ message: "Conversation ID is required to fetch messages" });
    }

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.and(q.eq(q.field("conversationId"), conversationId), q.neq(q.field("content"), "")))
      .order("desc")
      .take(lastN || 50);

    return messages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));
  },
});

export const askAssistant = internalAction({
  args: {
    conversationId: v.id("conversations"),
    model: ModelArg,
    userId: v.string(),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    try {
      const { conversationId, model, userId, messages } = args;

      if (!conversationId || !model || !userId || messages.length === 0) {
        throw new ConvexError({ message: "All fields are required to ask the assistant" });
      }

      let messageId: Id<"messages"> | undefined;
      const responseGenerator = generateLLMResponse(messages, model);
      if (typeof responseGenerator === "string") {
        // Error while generating response
        console.error("Error generating response:", responseGenerator);
        await ctx.runMutation(internal.chat.saveAssistantResponse, {
          conversationId,
          role: "assistant",
          content: "",
          reasoningContent: undefined,
          errorMessage: "Error while generating response",
          messageId: messageId,
          completed: true,
        });
        return;
      }

      for await (const response of responseGenerator) {
        // save the assistant's response
        const msgResponse = await ctx.runMutation(internal.chat.saveAssistantResponse, {
          conversationId,
          role: "assistant",
          content: response.content,
          reasoningContent: response.reasoning_content || undefined,
          errorMessage: response.errorMessage || undefined,
          messageId: messageId,
          completed: response.isComplete,
        });

        messageId = msgResponse.messageId;
      }
    } catch (error) {
      console.error({ error });
    }
  },
});

export const generateTitle = internalAction({
  args: {
    conversationId: v.id("conversations"),
    userContent: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, userContent } = args;

    if (!conversationId || !userContent) {
      throw new ConvexError({ message: "Conversation ID and content are required" });
    }

    const model = await ctx.runQuery(internal.chat.getModelByModelId, {
      modelId: "deepseek-chat",
    });

    const responseGenerator = generateLLMResponse(
      [
        {
          role: "system",
          content:
            "Generate a concise title for the conversation based on the user's input. respond with title only do not add any prefixes like 'title:' respond with direct title without event the string double quote and other wrapper.",
        },
        { role: "user", content: userContent },
      ],
      model
    );

    if (typeof responseGenerator === "string") {
      // Error while generating response
      console.error("Error generating title:", responseGenerator);
      return;
    }

    for await (const response of responseGenerator) {
      await ctx.runMutation(internal.chat.setTitle, {
        conversationId,
        title: response.content.trim(),
      });
    }
  },
});

export const saveAssistantResponse = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    reasoningContent: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { conversationId, role, content, reasoningContent, errorMessage, messageId, completed } = args;

    if (!conversationId || !role) {
      throw new ConvexError({ message: "Conversation ID or role are required" });
    }

    let newMessageId: Id<"messages"> | undefined = messageId;
    if (!messageId) {
      // create a new message
      newMessageId = await ctx.db.insert("messages", {
        conversationId,
        role,
        content: content,
        reasoningContent,
        errorMessage,
        completed,
      });
    } else {
      // update the existing message
      await ctx.db.patch(messageId, {
        role,
        content: content,
        reasoningContent,
        errorMessage,
        completed,
      });
    }

    // Update the conversation's updatedAt timestamp
    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
    });

    return { messageId: newMessageId };
  },
});

export const setTitle = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const { conversationId, title } = args;

    if (!conversationId) {
      throw new ConvexError({ message: "Conversation ID and title are required" });
    }

    if (!title) {
      return;
    }

    await ctx.db.patch(conversationId, {
      title: title.trim(),
      updatedAt: Date.now(),
    });
  },
});
