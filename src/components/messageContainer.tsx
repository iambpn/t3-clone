import { cn } from "@/lib/utils";
import type { ParamsType } from "@/types/params.type";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "../../convex/_generated/api";
import WelcomeMessage from "./WelcomeMessage";
import { LoadingSpinner } from "./loadingSpinner";
import { MessageChat } from "./messageChat";
import { MessageInput } from "./messageInput";
import { useSidebar } from "./ui/sidebar";
import { parseError, safeExec } from "@/lib/error";
import { toast } from "sonner";

type Props = {};

export default function MessageContainer({}: Props) {
  const { open } = useSidebar();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversationId } = useParams<ParamsType>();
  const navigate = useNavigate();

  const messages = safeExec(
    () =>
      useQuery(
        api.chat.getConversationMessages,
        conversationId
          ? {
              conversationId: conversationId as Id<"conversations">,
            }
          : "skip"
      ),
    (error) => {
      console.error("Failed to load messages", error);
      toast.error("Failed to load messages.");
      navigate("/");
    }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatWidth = open ? "md:w-[100%] lg:w-[70%]" : "md:w-[100%] lg:w-[60%]";

  return (
    <div className='flex flex-col flex-1 w-full items-center'>
      {/* Messages Container */}
      <div className={cn("h-full overflow-hidden transition-[width] duration-300 w-full", chatWidth)}>
        <div className='h-full px-4 py-1'>
          <div className='h-full overflow-y-auto'>
            {!conversationId && <WelcomeMessage showDescription={true} />}

            {conversationId && !messages && (
              <div className='flex items-center justify-center h-full'>
                <LoadingSpinner className='w-8! h-8!' />
              </div>
            )}

            {conversationId &&
              messages &&
              messages.map((message) => <MessageChat key={message._id} message={message} />)}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width] duration-300 w-full",
          chatWidth
        )}
      >
        <div className='px-2 py-2'>
          <MessageInput />
        </div>
      </div>
    </div>
  );
}
