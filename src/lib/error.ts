import { ConvexError } from "convex/values";

export function parseError(error: unknown): string {
  if (error instanceof ConvexError) {
    return error.data.message || "An error occurred";
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    return (error as { message: string }).message;
  }
  return "An unknown error occurred";
}

export function safeExec<TR, ER>(task: () => TR, onError: (error: unknown) => ER) {
  try {
    return task();
  } catch (error) {
    const rtn = onError(error);
    return rtn || undefined;
  }
}
