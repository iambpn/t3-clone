import { query } from "./_generated/server";

export const getSupportedModels = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query("models").collect();
    return models.map((model) => ({
      _id: model._id,
      name: model.name,
      capabilities: model.capabilities,
    }));
  },
});
