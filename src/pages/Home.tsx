import ChatSidebar from "@/components/chatSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { AppConstants } from "@/constants/app.constant";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, Mic, Paperclip, Send, Smile, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex h-screen w-full'>
        <ChatSidebar />
        <SidebarInset className='flex flex-col'>
          {/* Header */}
          <header className='flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center'>
                  <Bot className='w-4 h-4 text-white' />
                </div>
                <span className='font-semibold'>Current Chat</span>
              </div>
            </div>
          </header>

          {/* Messages Container */}
          <div className='flex-1 overflow-hidden'>
            <div className='h-full px-4 py-6'>
              <div className='h-full overflow-y-auto space-y-6'>
                {messages.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full text-center'>
                    <div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6'>
                      <Bot className='w-10 h-10 text-white' />
                    </div>
                    <h2 className='text-3xl font-bold text-foreground mb-3'>Welcome to {AppConstants.APP_NAME}</h2>
                    <p className='text-muted-foreground max-w-md text-lg'>
                      Start a conversation with our AI assistant. Ask questions, get help, or just chat!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className='w-10 h-10 border-2 border-blue-200 dark:border-blue-800'>
                          <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                            <Bot className='w-5 h-5' />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <Card
                        className={`max-w-[75%] p-4 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg"
                            : "bg-card border shadow-sm"
                        }`}
                      >
                        <div className='prose prose-sm max-w-none dark:prose-invert'>
                          <p
                            className={`m-0 leading-relaxed ${
                              message.role === "user" ? "text-white" : "text-foreground"
                            }`}
                          >
                            {message.content}
                          </p>
                        </div>
                      </Card>

                      {message.role === "user" && (
                        <Avatar className='w-10 h-10 border-2 border-border'>
                          <AvatarImage src='/placeholder.svg?height=40&width=40' />
                          <AvatarFallback className='bg-muted'>
                            <User className='w-5 h-5 text-muted-foreground' />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className='flex gap-4 justify-start'>
                    <Avatar className='w-10 h-10 border-2 border-blue-200 dark:border-blue-800'>
                      <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                        <Bot className='w-5 h-5' />
                      </AvatarFallback>
                    </Avatar>
                    <Card className='p-4 bg-card border shadow-sm'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span className='text-sm'>AI is thinking...</span>
                      </div>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Enhanced Input Area */}
          <div className='border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='px-4 py-4'>
              <form onSubmit={handleSubmit} className='relative'>
                <div className='relative flex items-end gap-3 p-3 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-ring/50 transition-colors'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='shrink-0 h-8 w-8 rounded-full hover:bg-muted'
                  >
                    <Paperclip className='w-4 h-4' />
                  </Button>

                  <div className='flex-1 relative'>
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder='Type your message... (Press Enter to send, Shift+Enter for new line)'
                      className='min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0'
                      disabled={isLoading}
                      rows={1}
                    />
                  </div>

                  <div className='flex items-center gap-1 shrink-0'>
                    <Button type='button' variant='ghost' size='icon' className='h-8 w-8 rounded-full hover:bg-muted'>
                      <Smile className='w-4 h-4' />
                    </Button>
                    <Button type='button' variant='ghost' size='icon' className='h-8 w-8 rounded-full hover:bg-muted'>
                      <Mic className='w-4 h-4' />
                    </Button>
                    <Button
                      type='submit'
                      disabled={isLoading || !input.trim()}
                      className='h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 p-0'
                    >
                      {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
                    </Button>
                  </div>
                </div>
              </form>

              <div className='flex items-center justify-between mt-2 px-3'>
                <p className='text-xs text-muted-foreground'>AI responses are generated by OpenAI GPT-4</p>
                <div className='text-xs text-muted-foreground'>{input.length > 0 && `${input.length} characters`}</div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
