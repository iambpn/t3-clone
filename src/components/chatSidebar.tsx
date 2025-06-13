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
import { timestampToRelativeDate } from "@/lib/date";
import { parseError, safeExec } from "@/lib/error";
import type { ParamsType } from "@/types/params.type";
import { SignedIn, SignedOut, SignInButton, useAuth, UserProfile, useUser } from "@clerk/react-router";
import { dark } from "@clerk/themes";
import { useQuery } from "convex/react";
import { Bot, ChevronDown, LogOut, MessageSquare, Plus, Settings } from "lucide-react";
import { useState } from "react";
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

export default function ChatSidebar() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const [openSetting, setOpenSetting] = useState(false);
  const navigate = useNavigate();
  const params = useParams<ParamsType>();

  const conversations = safeExec(
    () => useQuery(api.chat.getConversations),
    (error) => {
      const errorMessage = parseError(error);
      toast.error(errorMessage);
    }
  );

  const onConversationSelect = (conversationId: string | null) => {
    if (!conversationId) {
      navigate("/");
      return;
    }

    navigate(`/${conversationId}`);
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

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations &&
                  conversations.length > 0 &&
                  conversations.map((chat) => (
                    <SidebarMenuItem key={chat._id}>
                      <SidebarMenuButton
                        className='flex flex-col items-start h-auto py-2 gap-0.5'
                        isActive={chat._id === params.conversationId}
                        onClick={() => onConversationSelect(chat._id)}
                      >
                        <div className='flex items-center gap-2 w-full'>
                          <MessageSquare className='w-4 h-4 text-muted-foreground' />
                          <span className='font-medium truncate flex-1'>{chat.title}</span>
                        </div>
                        <div className='text-xs text-muted-foreground ml-6'>
                          {timestampToRelativeDate(chat.updatedAt)}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                {conversations && conversations.length === 0 && (
                  <div className='flex items-center justify-center h-8 text-muted-foreground'>
                    No conversations found
                  </div>
                )}
                {!conversations && (
                  <div className='flex items-center justify-center h-8'>
                    <LoadingSpinner className='w-6! h-6!' />
                  </div>
                )}
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
