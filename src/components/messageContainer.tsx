import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, Mic, Paperclip, Send, Smile, User } from "lucide-react";
import { useEffect, useRef } from "react";
import WelcomeMessage from "./WelcomeMessage";
import { useSidebar } from "./ui/sidebar";

type Props = {};

export default function MessageContainer({}: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const { open } = useSidebar();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const chatWidth = open ? "md:w-[100%] lg:w-[70%]" : "md:w-[100%] lg:w-[60%]";

  return (
    <div className='flex flex-col flex-1 w-full items-center'>
      {/* Messages Container */}
      <div className={cn("h-full overflow-hidden transition-[width] duration-300 w-full", chatWidth)}>
        <div className='h-full px-4 py-1'>
          <div className='h-full overflow-y-auto'>
            {messages.length === 0 ? (
              <WelcomeMessage showDescription={true} />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} mt-2`}
                >
                  {message.role === "assistant" && (
                    <Avatar className='w-10 h-10 border-2 border-blue-200 dark:border-blue-800'>
                      <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                        <Bot className='w-5 h-5' />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <Card
                    className={`max-w-[75%] p-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg rounded-tr-none"
                        : "bg-card border shadow-sm rounded-tl-none"
                    }`}
                  >
                    <div className='prose prose-sm max-w-none dark:prose-invert'>
                      <p
                        className={`m-0 leading-relaxed ${message.role === "user" ? "text-white" : "text-foreground"}`}
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
              <div className='flex gap-4 justify-start mt-2'>
                <Avatar className='w-10 h-10 border-2 border-blue-200 dark:border-blue-800'>
                  <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                    <Bot className='w-5 h-5' />
                  </AvatarFallback>
                </Avatar>
                <Card className='p-4 bg-card border shadow-sm rounded-tl-none'>
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

      {/* Input Area */}
      <div
        className={cn(
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width] duration-300 w-full",
          chatWidth
        )}
      >
        <div className='px-2 py-2'>
          <form onSubmit={handleSubmit} className='relative'>
            <div className='relative flex flex-col p-2 gap-0.5 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-ring/50 transition-colors'>
              <div className='relative flex items-center gap-2'>
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
                    placeholder='Type your message...'
                    className='min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent'
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
                    title='Press Enter to send, Shift+Enter for new line'
                  >
                    {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
                  </Button>
                </div>
              </div>
              <div className='flex justify-between px-2'>
                <div className='flex items-center gap-2 mt-2'>
                  <Select defaultValue='gpt-3.5-turbo'>
                    <SelectTrigger className='border-0 p-0 h-fit! w-auto text-xs text-muted-foreground hover:text-foreground transition-colors focus:ring-0! bg-transparent! shadow-none gap-1!'>
                      <SelectValue placeholder='Select Model' />
                    </SelectTrigger>
                    <SelectContent className='min-w-[140px] p-0 border-0'>
                      <SelectItem value='gpt-3.5-turbo' className='text-xs'>
                        GPT-3.5 Turbo
                      </SelectItem>
                      <SelectItem value='gpt-4' className='text-xs'>
                        GPT-4
                      </SelectItem>
                      <SelectItem value='claude-2' className='text-xs'>
                        Claude 2
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex items-center justify-between mt-2'>
                  <div className='text-xs text-muted-foreground'>
                    {input.length > 0 && `${input.length} characters`}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
