import ChatSidebar from "@/components/chatSidebar";
import { LoadingProgress } from "@/components/loadingProgress";
import MessageContainer from "@/components/messageContainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import WelcomeMessage from "@/components/WelcomeMessage";
import { useAuth, useClerk, useUser } from "@clerk/react-router";
import { dark } from "@clerk/themes";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";

export default function ChatApp() {
  const { isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const cookie = document.cookie;
    const state = cookie.split(`${SIDEBAR_COOKIE_NAME}=`)[1];
    const open = state ? state.split(";")[0] === "true" : true;
    setSidebarOpen(open);
  }, []);

  if (!isLoaded) {
    return (
      <div className='flex h-screen w-full flex-col '>
        <LoadingProgress />
        <div className='flex-1 flex items-center justify-center'>
          <WelcomeMessage />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <div className='flex h-screen w-full'>
        <ChatSidebar />
        <SidebarInset className='flex flex-col'>
          {/* Header */}
          <header className='flex h-14 shrink-0 items-center justify-between gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center'>
                  <Bot className='w-4 h-4 text-white' />
                </div>
                <span className='font-semibold'>Current Chat</span>
              </div>
            </div>
            <div className='px-4'>
              {user && (
                <Avatar className='w-8 h-8'>
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                    {user?.firstName?.charAt(0) || "U"}
                    {user?.lastName?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
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

          <MessageContainer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
