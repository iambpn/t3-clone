import { parseError, safeExec } from "@/lib/error";
import type { ParamsType } from "@/types/params.type";
import { useClerk, useUser } from "@clerk/react-router";
import { dark } from "@clerk/themes";
import { usePaginatedQuery } from "convex/react";
import { Bot } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function HeaderUI() {
  const { user } = useUser();
  const clerk = useClerk();
  const params = useParams<ParamsType>();

  const conversations = safeExec(
    () =>
      usePaginatedQuery(
        api.chat.getConversations,
        {},
        {
          initialNumItems: 10,
        }
      ),
    (error) => {
      toast.error(parseError(error));
    }
  );

  const selectedConversation = conversations?.results.find((conversation) => conversation._id === params.conversationId);

  return (
    <header className='flex h-14 shrink-0 items-center justify-between gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center'>
            <Bot className='w-4 h-4 text-white' />
          </div>
          <span className='font-semibold'>{selectedConversation?.title || "Start New Conversation"}</span>
        </div>
      </div>
      <div className='px-4'>
        {user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className='w-8 h-8'>
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                  {user?.firstName?.charAt(0) || "U"}
                  {user?.lastName?.charAt(0) || ""}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className='font-medium text-sm'>{user.fullName}</p>
              <p className='text-xs text-gray-700'>{user.emailAddresses[0].emailAddress}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {!user && (
          <div
            className='flex items-center gap-2 cursor-pointer hover:underline'
            onClick={() =>
              clerk.openSignIn({
                appearance: {
                  baseTheme: dark,
                },
              })
            }
          >
            <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center'>
              <Bot className='w-4 h-4 text-white' />
            </div>
            <div className='font-semibold'>Sign In</div>
          </div>
        )}
      </div>
    </header>
  );
}
