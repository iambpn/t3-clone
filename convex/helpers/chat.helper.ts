import type { GenericQueryCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

export async function getParentMessages(
  conversation: DataModel["conversations"]["document"],
  ctx: GenericQueryCtx<DataModel>,
  options?: {
    take?: number;
  }
) {
  if (conversation.parentConversationId) {
    const splitMessage = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("_id"), conversation.splitFromMessageId))
      .first();

    if (!splitMessage) {
      throw new ConvexError("Split message not found for the conversation");
    }

    // get all the messages from the parent conversation before splitting
    const queryBuilder = ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversationId", conversation.parentConversationId!).lte("_creationTime", splitMessage._creationTime)
      )
      .order("asc");

    if (options?.take) {
      return await queryBuilder.take(options.take);
    }

    return await queryBuilder.collect();
  }

  return [];
}

export async function getAllChildConversations(conversationId: Id<"conversations">, ctx: GenericQueryCtx<DataModel>) {
  const childConversations = await ctx.db
    .query("conversations")
    .withIndex("by_conversation_parent", (q) => q.eq("parentConversationId", conversationId))
    .collect();

  return childConversations;
}

export function transformConversationData(conversations: DataModel["conversations"]["document"][]) {
  return conversations.map((conversation) => ({
    _id: conversation._id,
    title: conversation.title,
    userId: conversation.userId,
    parentConversationId: conversation.parentConversationId,
    updatedAt: conversation.updatedAt,
  }));
}
