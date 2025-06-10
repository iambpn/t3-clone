import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Bot, ChevronDown, LogOut, MessageSquare, Plus, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const previousChats = [
  { id: "1", title: "React Best Practices", lastMessage: "Thanks for the help!", timestamp: "2 hours ago" },
  { id: "2", title: "TypeScript Questions", lastMessage: "How do I type this?", timestamp: "1 day ago" },
  { id: "3", title: "Next.js Deployment", lastMessage: "Deployment successful!", timestamp: "3 days ago" },
  { id: "4", title: "Database Design", lastMessage: "What about normalization?", timestamp: "1 week ago" },
  { id: "5", title: "API Integration", lastMessage: "Perfect, that works!", timestamp: "2 weeks ago" },
];

export default function ChatSidebar() {
  return (
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

        <Button className='mx-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'>
          <Plus className='w-4 h-4 mr-2' />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {previousChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton className='flex flex-col items-start h-auto py-2 gap-0.5'>
                    <div className='flex items-center gap-2 w-full'>
                      <MessageSquare className='w-4 h-4 text-muted-foreground' />
                      <span className='font-medium truncate flex-1'>{chat.title}</span>
                    </div>
                    <div className='text-xs text-muted-foreground ml-6'>{chat.timestamp}</div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className='h-12'>
                  <Avatar className='w-8 h-8'>
                    <AvatarImage src='/placeholder.svg?height=32&width=32' />
                    <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col items-start flex-1'>
                    <span className='font-medium'>John Doe</span>
                    <span className='text-xs text-muted-foreground'>john@example.com</span>
                  </div>
                  <ChevronDown className='w-4 h-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side='top' className='w-56'>
                <DropdownMenuItem>
                  <Settings className='w-4 h-4 mr-2' />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='text-red-600'>
                  <LogOut className='w-4 h-4 mr-2' />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
