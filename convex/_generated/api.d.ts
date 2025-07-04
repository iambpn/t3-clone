/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chat from "../chat.js";
import type * as constants_model from "../constants/model.js";
import type * as constants_systemPrompt from "../constants/systemPrompt.js";
import type * as model from "../model.js";
import type * as providers_DeepSeek from "../providers/DeepSeek.js";
import type * as providers_Gemini from "../providers/Gemini.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  "constants/model": typeof constants_model;
  "constants/systemPrompt": typeof constants_systemPrompt;
  model: typeof model;
  "providers/DeepSeek": typeof providers_DeepSeek;
  "providers/Gemini": typeof providers_Gemini;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
