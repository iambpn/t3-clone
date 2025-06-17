import ChatSidebar from "@/components/chatSidebar";
import { HeaderUI } from "@/components/headerUI";
import MessageContainer from "@/components/messageContainer";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const cookie = document.cookie;
    const state = cookie.split(`${SIDEBAR_COOKIE_NAME}=`)[1];
    const open = state ? state.split(";")[0] === "true" : true;
    setSidebarOpen(open);
  }, []);

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className='flex h-[100dvh] w-full'>
        <ChatSidebar />
        <SidebarInset className='flex flex-col'>
          <HeaderUI />
          <MessageContainer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
