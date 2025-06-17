import { safeExec } from "@/lib/error";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { ParamsType } from "@/types/params.type";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import WelcomeMessage from "./WelcomeMessage";
import { LoadingSpinner } from "./loadingSpinner";
import { ChatMessageUI } from "./chatMessageUI";
import { MessageInput } from "./messageInput";
import { useSidebar } from "./ui/sidebar";
type Props = {};

export default function MessageContainer({}: Props) {
  const { open } = useSidebar();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const isAssistantMessageLoading = useAppStore((state) => state.isMessageLoading);
  const setAssistantMessageLoading = useAppStore((state) => state.setIsMessageLoading);

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

  const chatWidth = open ? "md:w-[100%] lg:w-[70%]" : "md:w-[100%] lg:w-[60%]";
  const lastMessage = messages?.[messages.length - 1];
  const isAssistantSteaming = lastMessage?.role === "assistant" && !lastMessage.isCompleted;

  // Define threshold for near-bottom detection
  const NEAR_BOTTOM_THRESHOLD = 10; // pixels from bottom

  // Check if user is near bottom of scroll
  const checkIfNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < NEAR_BOTTOM_THRESHOLD;
    return isNearBottom;
  };

  // Handle scroll events
  const handleScroll = () => {
    const isNearBottom = checkIfNearBottom();
    setIsUserScrolledUp(!isNearBottom);
  };

  // Auto-scroll only if user hasn't scrolled up
  useEffect(() => {
    if (!isUserScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserScrolledUp]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    setIsUserScrolledUp(false);
  }, [conversationId]);

  // update loading state for assistant message
  useEffect(() => {
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.isCompleted) {
      setAssistantMessageLoading(false);
    }
  }, [lastMessage]);

  return (
    <div className='flex flex-col flex-1 w-full items-center overflow-hidden'>
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn("flex flex-1 justify-center overflow-y-scroll transition-[width] duration-300 w-full")}
      >
        <div className={cn("h-full px-4 py-1 w-full", chatWidth)}>
          <div className='h-full'>
            {!conversationId && <WelcomeMessage showDescription={true} />}

            {conversationId && !messages && (
              <div className='flex items-center justify-center h-full'>
                <LoadingSpinner className='w-8! h-8!' />
              </div>
            )}

            {conversationId &&
              messages &&
              messages.map((message) => <ChatMessageUI key={message._id} message={message} />)}

            {conversationId && isAssistantMessageLoading && !isAssistantSteaming && (
              <div className='flex items-center justify-start pb-4 pt-2 gap-2.5 text-gray-500'>
                <LoadingSpinner className='w-5! h-5!' />
                <span className='text-sm font-semibold'>Going through your prompts ...</span>
              </div>
            )}

            {/* Scroll to bottom */}
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
      {/* <span className='text-gray-500 text-xs absolute bottom-0 right-0 mr-4.5 mb-2.5 lg:mb-1 lg:mr-2'>
        <a href='https://github.com/iambpn' className='hover:underline' target='_blank' rel='noopener noreferrer'>
          @iambpn
        </a>
      </span> */}
    </div>
  );
}
