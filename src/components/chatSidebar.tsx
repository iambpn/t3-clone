import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AppConstants } from "@/constants/app.constant";
import { useScrolledToBottom } from "@/hooks/useScrollToBottom";
import { timestampToRelativeDate } from "@/lib/date";
import { parseError, safeExec } from "@/lib/error";
import type { ParamsType } from "@/types/params.type";
import { SignedIn, SignedOut, SignInButton, useAuth, UserProfile, useUser } from "@clerk/react-router";
import { dark } from "@clerk/themes";
import { useMutation, usePaginatedQuery } from "convex/react";
import { Bot, ChevronDown, LogOut, MessageSquare, Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { LoadingSpinner } from "./loadingSpinner";
import { Modal } from "./modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import type { Id } from "convex/_generated/dataModel";

const CONVERSATION_PER_PAGE = 20;

export default function ChatSidebar() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const [openSetting, setOpenSetting] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<Id<"conversations"> | null>(null);

  const navigate = useNavigate();
  const params = useParams<ParamsType>();

  const { isAtBottom } = useScrolledToBottom(scrollContainerRef, 10);

  const hasScrollbar =
    (scrollContainerRef.current?.scrollHeight ?? 0) > (scrollContainerRef.current?.clientHeight ?? 0);

  const conversations = safeExec(
    () =>
      usePaginatedQuery(
        api.chat.getConversations,
        {},
        {
          initialNumItems: CONVERSATION_PER_PAGE,
        }
      ),
    (error) => {
      const errorMessage = parseError(error);
      toast.error(errorMessage);
    }
  );

  const deleteConversation = useMutation(api.chat.deleteConversation);

  useEffect(() => {
    // if scrolled to bottom, load more conversations
    if (isAtBottom && conversations && !conversations.isLoading && conversations.status === "CanLoadMore") {
      conversations.loadMore(CONVERSATION_PER_PAGE);
    }
  }, [isAtBottom]);

  useEffect(() => {
    // if conversations is loaded and the scrollbar is not present then load another page until either scrollbar appears or no more conversations are available
    if (conversations && !conversations.isLoading && !hasScrollbar && conversations.status === "CanLoadMore") {
      conversations.loadMore(CONVERSATION_PER_PAGE);
    }
  }, [hasScrollbar, conversations]);

  const onConversationSelect = (conversationId: string | null) => {
    if (!conversationId) {
      navigate("/");
      return;
    }

    navigate(`/${conversationId}`);
  };

  const onDeleteConversation = async (conversationId: Id<"conversations">) => {
    if (!isSignedIn) {
      toast.error("You must be signed in to delete a conversation.");
      return;
    }

    try {
      setDeletingConversationId(conversationId);
      await deleteConversation({ conversationId });
      setDeletingConversationId(null);
      if (params.conversationId === conversationId) {
        navigate("/");
      }
      toast.success("Conversation deleted successfully.");
    } catch (error) {
      const errorMessage = parseError(error);
      console.error("Error deleting conversation:", error);
      toast.error(`Failed to delete conversation: ${errorMessage}`);
    }
  };

  return (
    <>
      <Sidebar className='border-r'>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className='flex items-center gap-3 px-2 py-3'>
                <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                  <Bot className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h2 className='font-semibold text-lg'>{AppConstants.APP_NAME}</h2>
                  <p className='text-xs text-muted-foreground'>AI Assistant</p>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>

          <Button
            className='mx-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            onClick={() => onConversationSelect(null)}
          >
            <Plus className='w-4 h-4 mr-2' />
            New Chat
          </Button>
        </SidebarHeader>

        <SidebarContent ref={scrollContainerRef}>
          <SidebarGroup>
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
            <SidebarGroupContent className='overflow-y-auto'>
              <SidebarMenu>
                {conversations &&
                  !!conversations.results.length &&
                  conversations.results.map((chat) => (
                    <SidebarMenuItem key={chat._id} className='group/menu-item-custom'>
                      <SidebarMenuButton
                        className='flex flex-col items-start h-auto py-2 gap-0.5'
                        isActive={chat._id === params.conversationId}
                        onClick={() => onConversationSelect(chat._id)}
                      >
                        <div className='flex items-center gap-2 w-full'>
                          <MessageSquare className='w-4 h-4 text-muted-foreground' />
                          <span className='font-medium truncate flex-1'>{chat.title}</span>
                          {deletingConversationId !== chat._id && (
                            <Trash2
                              className='w-4 h-4 opacity-0 group-hover/menu-item-custom:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity'
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(chat._id);
                              }}
                            />
                          )}
                          {deletingConversationId === chat._id && <LoadingSpinner className={`w-4! h-4!`} />}
                        </div>
                        <div className='text-xs text-muted-foreground ml-6'>
                          {timestampToRelativeDate(chat.updatedAt)}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                {conversations && !conversations.isLoading && conversations.results.length === 0 && (
                  <div className='flex items-center justify-center h-8 text-muted-foreground'>
                    {isSignedIn ? "No conversations found" : "Sign in to start chatting"}
                  </div>
                )}

                {!conversations ||
                  (conversations.isLoading && (
                    <div className='flex items-center justify-center h-8'>
                      <LoadingSpinner className='w-6! h-6!' />
                    </div>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SignedOut>
            <SignInButton mode='modal' appearance={{ baseTheme: dark }}>
              <Button className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'>
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className='h-12'>
                      <Avatar className='w-8 h-8'>
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                          {user?.firstName?.charAt(0) || "U"}
                          {user?.lastName?.charAt(0) || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col items-start flex-1'>
                        <span className='font-medium'>{user?.fullName}</span>
                        <span className='text-xs text-muted-foreground'>{user?.emailAddresses[0].emailAddress}</span>
                      </div>
                      <ChevronDown className='w-4 h-4' />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side='top' className='w-56'>
                    <DropdownMenuItem onClick={() => setOpenSetting(true)}>
                      <Settings className='w-4 h-4 mr-2' />
                      Manege Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='text-red-600' onClick={() => signOut()}>
                      <LogOut className='w-4 h-4 mr-2' />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SignedIn>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {isSignedIn && openSetting && (
        <Modal isOpen={openSetting} onClose={() => setOpenSetting(false)}>
          <UserProfile
            appearance={{
              baseTheme: dark,
              elements: {
                cardBox: "h-[40rem]!",
              },
            }}
          />
        </Modal>
      )}
    </>
  );
}
