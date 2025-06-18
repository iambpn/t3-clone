import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import "github-markdown-css/github-markdown-dark.css";
import "highlight.js/styles/github-dark.min.css";
import { ChevronDown, ChevronUp, Split } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RenderMarkdown } from "./renderMarkdown";
import { Card } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useNavigate } from "react-router";
import { LoadingSpinner } from "./loadingSpinner";

type Props = {
  message: (typeof api.chat.getConversationMessages._returnType)[number];
  isSplittedConversation: boolean;
};
export function ChatMessageUI({ message, isSplittedConversation }: Props) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const navigate = useNavigate();
  const splitConversation = useMutation(api.chat.createSplitConversation);

  const handleSplitConversation = async () => {
    if (isSplittedConversation) return;

    try {
      const { conversationId } = await splitConversation({
        parentConversationId: message.conversationId as Id<"conversations">,
        splitFromMessageId: message._id,
      });
      navigate(`/${conversationId}`);
    } catch (error) {
      console.error("Failed to split conversation:", error);
      toast.error("Failed to split conversation. Please try again.");
    }
  };

  return (
    <div
      key={message._id}
      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} mt-2 group/control`}
    >
      {message.role === "user" && (
        <div className='max-w-[60%] py-5'>
          <Card
            className={`p-2 rounded-3xl px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg`}
          >
            <div className='max-w-none prose prose-sm dark:prose-invert'>
              <p className={`m-0 leading-relaxed text-white`}>{message.content}</p>
            </div>
          </Card>
        </div>
      )}

      {message.role === "assistant" && (
        <div className='w-full prose prose-sm dark:prose-invert py-5'>
          {message.isSummary && (
            <div className='max-w-none flex items-center gap-2 mb-2 justify-between pr-8'>
              <p className={`m-0 leading-relaxed text-muted-foreground font-semibold`}>Summary</p>
              {!message.isCompleted && (
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground font-normal text-sm'>In-Progress</span>
                  <LoadingSpinner className='w-3! h-3!' />
                </div>
              )}
            </div>
          )}

          {message.reasoningContent && (
            <Collapsible open={isReasoningOpen} onOpenChange={setIsReasoningOpen}>
              <div className='flex items-center'>
                <CollapsibleTrigger asChild>
                  <div className={cn("flex items-center gap-2 mb-2 text-gray-500 cursor-pointer")}>
                    <span className='text-sm font-semibold'>Thoughts</span>
                    {isReasoningOpen ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                  </div>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className='text-gray-500 mb-2 break-all text-sm'>
                  <RenderMarkdown content={message.reasoningContent} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className={`m-0 leading-relaxed text-foreground markdown-body bg-transparent!`}>
            <RenderMarkdown content={message.content} />
          </div>

          {message.errorMessage && (
            <div className='text-red-500 mt-2'>
              <strong>Error:</strong> {message.errorMessage}
            </div>
          )}

          {/* add copy icons */}
          {!isSplittedConversation && (
            <div className='flex items-center gap-2 mt-2.5 cursor-pointer group-hover/control:opacity-100 opacity-0 transition-opacity duration-200'>
              <div className='p-1 hover:bg-muted rounded-2xl'>
                <Split className='h-4.5 w-4.5' onClick={handleSplitConversation} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
