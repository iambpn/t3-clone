import { cn } from "@/lib/utils";
import type { api } from "convex/_generated/api";
import "github-markdown-css/github-markdown-dark.css";
import "highlight.js/styles/github-dark.min.css";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { RenderMarkdown } from "./renderMarkdown";
import { Card } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

type Props = {
  message: (typeof api.chat.getConversationMessages._returnType)[number];
};
export function ChatMessageUI({ message }: Props) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  return (
    <div key={message._id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} mt-2`}>
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
        </div>
      )}
    </div>
  );
}
