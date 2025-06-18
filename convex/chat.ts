import { paginationOptsValidator, type PaginationResult } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { SummarizeSystemPrompt } from "./constants/systemPrompt";
import { getAllChildConversations, getParentMessages, transformConversationData } from "./helpers/chat.helper";
import { generateLLMResponse } from "./helpers/llm.helper";
import { ChatRoles, ModelArg } from "./types";
import { AppConfig } from "./constants/app.config";

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

    const transformedPage = transformConversationData(paginatedConversations.page);

    return {
      ...paginatedConversations,
      page: transformedPage,
    };
  },
});

export const getChildConversations = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError("You are not authenticated to view conversations");
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), conversationId))
      .first();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    const childConversations = await getAllChildConversations(conversationId, ctx);

    return transformConversationData(childConversations);
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

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), conversationId))
      .first();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    const parentMessages = await getParentMessages(conversation, ctx);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversation._id))
      .order("asc")
      .collect();

    // get message summary
    const summaryContent = await ctx.runQuery(internal.chat.getSummaryContentByConversationId, {
      conversationId: conversation._id,
    });

    const combinedMessages = summaryContent
      ? [summaryContent, ...parentMessages, ...messages]
      : [...parentMessages, ...messages];

    return combinedMessages.map((message) => ({
      _id: message._id,
      role: message.role,
      content: message.content,
      reasoningContent: message.reasoningContent,
      errorMessage: message.errorMessage,
      conversationId: message.conversationId,
      isCompleted: message.completed,
      isSummary: message.isSummary || false,
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

      conversation = await ctx.db
        .query("conversations")
        .filter((q) => q.eq(q.field("_id"), newConversationId))
        .first();
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
      take: AppConfig.defaultMessageContext,
    });

    // call the assistant api
    await ctx.scheduler.runAfter(0, internal.chat.chatWithAssistant, {
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

export const createSplitConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    splitFromMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { conversationId, splitFromMessageId } = args;

    // auth identity
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError({ message: "You are not authenticated." });
    }

    if (!conversationId || !splitFromMessageId) {
      throw new ConvexError({ message: "Conversation ID and split message ID are required" });
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), conversationId))
      .first();

    if (!conversation) {
      throw new ConvexError({ message: "Conversation not found" });
    }

    if (conversation.parentConversationId) {
      throw new ConvexError({
        message:
          "This conversation is already splitted. Either convert to parent conversation and try again or start with new chat.",
      });
    }

    const splitMessage = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("_id"), splitFromMessageId))
      .first();

    if (!splitMessage) {
      throw new ConvexError({ message: "Split message not found" });
    }

    // Create a new conversation based on the split message
    const newConversationId = await ctx.runMutation(internal.chat.createConversation, {
      userId: conversation.userId,
      title: `Split from ${conversation.title}`,
      parentId: conversation._id,
      splitFromMessageId: splitMessage._id,
    });

    /**
     * TODO: splitted conv title can be improved.
     */

    return newConversationId;
  },
});

export const convertSplitConversationToParent = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;

    // auth identity
    const user = await ctx.auth.getUserIdentity();

    if (!user) {
      throw new ConvexError({ message: "You are not authenticated." });
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), conversationId))
      .first();

    if (!conversation) {
      throw new ConvexError({ message: "Conversation not found" });
    }

    // Check if the conversation is already a parent
    if (!conversation.parentConversationId) {
      throw new ConvexError({ message: "This conversation is already a parent conversation" });
    }

    // get parent conversation
    const parentMessages = await getParentMessages(conversation, ctx, {
      take: AppConfig.defaultMessageContext,
    });

    // summarize the parent messages
    await ctx.scheduler.runAfter(0, internal.chat.summarizeMessages, {
      conversationId: conversation._id,
      messages: parentMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Update the conversation to remove the parent relationship
    await ctx.db.patch(conversationId, {
      parentConversationId: undefined,
      splitFromMessageId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), conversationId))
      .first();

    if (!conversation) {
      throw new ConvexError({ message: "Conversation not found for provided conversation id" });
    }

    if (conversation.parentConversationId) {
      // delete child conversation and its messages
      const childConversations = await getAllChildConversations(conversationId, ctx);

      await Promise.all(
        childConversations.map(async (childConversation) => {
          // defer deleting message later
          await ctx.scheduler.runAfter(0, internal.chat.deleteConversationMessages, {
            conversationId: childConversation._id,
          });

          // delete the child conversation itself
          await ctx.db.delete(childConversation._id);
        })
      );
    }

    // defer deleting child messages later
    await ctx.scheduler.runAfter(0, internal.chat.deleteConversationMessages, {
      conversationId: conversationId,
    });

    // Delete the conversation itself
    await ctx.db.delete(conversationId);
  },
});

export const deleteConversationMessages = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;

    // Delete all messages associated with the conversation
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});

export const createConversation = internalMutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
    parentId: v.optional(v.id("conversations")),
    splitFromMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const { userId, title, parentId, splitFromMessageId } = args;

    if (!userId) {
      throw new ConvexError("User ID is required to create a conversation");
    }

    const newConversationId = await ctx.db.insert("conversations", {
      title: title || "New Conversation",
      userId,
      parentConversationId: parentId?.toString(),
      splitFromMessageId: splitFromMessageId?.toString(),
      updatedAt: Date.now(),
    });

    return newConversationId;
  },
});

export const saveSummarizedContent = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    summarizedContent: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { conversationId, summarizedContent, errorMessage } = args;

    if (!conversationId || !summarizedContent) {
      throw new ConvexError({ message: "Conversation ID and summarized content are required" });
    }

    // previous summary exists, update it
    const existingSummary = await ctx.db
      .query("conversationSummaries")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .first();

    if (existingSummary) {
      await ctx.db.patch(existingSummary._id, {
        summarizedContent: summarizedContent.trim(),
        errorMessage: errorMessage?.trim(),
      });
      return existingSummary._id;
    }

    return await ctx.db.insert("conversationSummaries", {
      conversationId,
      summarizedContent: summarizedContent.trim(),
      errorMessage: errorMessage?.trim(),
    });
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
    take: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { conversationId, take } = args;

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), conversationId))
      .first();

    if (!conversation) {
      throw new ConvexError({ message: "Conversation not found for given conversationId" });
    }

    const queryBuilder = ctx.db
      .query("messages")
      .filter((q) => q.and(q.eq(q.field("conversationId"), conversationId), q.neq(q.field("content"), "")))
      .order("desc");

    let messages: DataModel["messages"]["document"][] = [];

    if (take) {
      messages = await queryBuilder.take(take);
    } else {
      messages = await queryBuilder.collect();
    }

    let parentMessages: DataModel["messages"]["document"][] = [];
    if (!take || messages.length < take) {
      const newLimit = !take ? undefined : take - messages.length;

      parentMessages = await getParentMessages(conversation, ctx, {
        take: newLimit,
      });
    }

    let combinedMessages: { role: ChatRoles; content: string }[] = [...parentMessages, ...messages];

    // if combined messages are less than the limit, fetch summary content
    // and prepend it to the messages
    if (!take || combinedMessages.length < take) {
      // get summary content if available
      const summaryContent = await ctx.runQuery(internal.chat.getSummaryContentByConversationId, {
        conversationId: conversation._id,
      });

      if (summaryContent) {
        combinedMessages = [summaryContent, ...combinedMessages];
      }
    }

    return combinedMessages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));
  },
});

export const getSummaryContentByConversationId = internalQuery({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { conversationId } = args;

    if (!conversationId) {
      throw new ConvexError({ message: "Conversation ID is required to fetch summary content" });
    }

    const conversationSummary = await ctx.db
      .query("conversationSummaries")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .first();

    if (!conversationSummary) {
      return null;
    }

    return {
      _id: conversationSummary._id,
      errorMessage: conversationSummary.errorMessage || undefined,
      content: conversationSummary.summarizedContent,
      role: "assistant" as const,
      reasoningContent: undefined,
      isCompleted: true,
      isSummary: true,
    };
  },
});

export const chatWithAssistant = internalAction({
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

export const summarizeMessages = internalAction({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { conversationId, messages } = args;

    if (messages.length === 0) {
      console.info("No messages provided for summarization");
      return;
    }

    const model = await ctx.runQuery(internal.chat.getModelByModelId, {
      modelId: "deepseek-reasoner",
    });

    const responseGenerator = generateLLMResponse([SummarizeSystemPrompt, ...messages], model);

    if (typeof responseGenerator === "string") {
      // Error while generating response
      console.error("Error generating summary:", responseGenerator);
      await ctx.scheduler.runAfter(0, internal.chat.saveSummarizedContent, {
        conversationId: conversationId,
        summarizedContent: "",
        errorMessage: responseGenerator || "Error while generating summary",
      });
      return;
    }

    let summaryContent = "";
    let errorMessage = "";
    for await (const response of responseGenerator) {
      summaryContent += response.content;
      errorMessage = response.errorMessage || "";
    }

    await ctx.scheduler.runAfter(0, internal.chat.saveSummarizedContent, {
      conversationId: conversationId,
      summarizedContent: summaryContent.trim(),
      errorMessage: errorMessage.trim(),
    });
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
