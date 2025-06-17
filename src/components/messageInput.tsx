import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseError, safeExec } from "@/lib/error";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useModalStore } from "@/store/useModelStore";
import type { ParamsType } from "@/types/params.type";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Brain, Eye, Loader2, Mic, Paperclip, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { api } from "../../convex/_generated/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function MessageInput() {
  const [input, setInput] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isMessageLoading, setIsMessageLoading] = useAppStore(
    useShallow((state) => [state.isMessageLoading, state.setIsMessageLoading])
  );

  const { conversationId } = useParams<ParamsType>();
  const navigate = useNavigate();

  const { selectedModel, setSelectedModel } = useModalStore(
    useShallow((state) => ({
      selectedModel: state.selectedModel,
      setSelectedModel: state.setSelectedModel,
    }))
  );

  const models = safeExec(
    () => useQuery(api.model.getSupportedModels),
    (error) => {
      toast.error(parseError(error));
    }
  );

  const sendMessageMutation = useMutation(api.chat.sendMessage);

  const getModels = () => {
    if (models) {
      return models;
    }

    if (selectedModel) {
      return [selectedModel];
    }

    return [];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isMessageLoading) {
        handleSubmit(e as any);
      }
    }
  };

  const onModelChange = (modelId: string | null) => {
    const model = models?.find((m) => m._id === modelId);
    setSelectedModel(model || null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (!selectedModel || !selectedModel._id) {
      toast.error("Please select a model before sending a message.");
      return;
    }

    const message = input.trim();
    setInput("");

    try {
      const res = await sendMessageMutation({
        conversationId: (conversationId as Id<"conversations">) || undefined,
        modelId: selectedModel._id,
        content: message,
      });

      navigate(`/${res.conversationId}`);
      setIsMessageLoading(true);
    } catch (error: unknown) {
      const errorMessage = parseError(error);
      toast.error(errorMessage);
      setIsMessageLoading(false);
    }
  };

  // set the default model
  useEffect(() => {
    if (selectedModel) return;

    setSelectedModel(models?.[0] || null);
  }, [models]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className='relative'>
      <div className='relative flex flex-col p-2 gap-0.5 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-ring/50 transition-colors'>
        <div className='relative flex items-center gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='shrink-0 h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-muted-foreground'
              >
                <Paperclip className='w-4 h-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>File input is not supported yet</p>
            </TooltipContent>
          </Tooltip>

          <div className='flex-1 relative'>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder='Type your message...'
              className='min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent'
              disabled={isMessageLoading}
              rows={1}
            />
          </div>

          <div className='flex items-center gap-1 shrink-0'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-muted-foreground'
                >
                  <Smile className='w-4 h-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Emoji input is not supported yet</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-muted-foreground'
                >
                  <Mic className='w-4 h-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice input is not supported yet</p>
              </TooltipContent>
            </Tooltip>

            <Button
              type='submit'
              disabled={isMessageLoading || !input.trim()}
              className='h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 p-0'
              title='Press Enter to send, Shift+Enter for new line'
            >
              {isMessageLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
            </Button>
          </div>
        </div>
        <div className='flex justify-between px-2'>
          <div className='flex items-center gap-2 mt-2'>
            <Select value={selectedModel?._id || undefined} onValueChange={onModelChange}>
              <SelectTrigger className='border-0 p-0 h-fit! w-auto text-xs text-muted-foreground hover:text-foreground transition-colors focus:ring-0! bg-transparent! shadow-none gap-1!'>
                <SelectValue placeholder='Select Model' />
              </SelectTrigger>
              <SelectContent className='min-w-[140px] p-0 border-0'>
                {getModels().map((model) => (
                  <SelectItem value={model._id} className='text-xs' key={model._id}>
                    {model.name}
                    {model.capabilities.vision && <Eye className={cn("ml-1 w-3 h-3")} />}
                    {model.capabilities.reasoning && <Brain className={cn("ml-1 w-3 h-3")} />}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center justify-between mt-2'>
            <div className='text-xs text-muted-foreground'>{input.length > 0 && `${input.length} characters`}</div>
          </div>
        </div>
      </div>
    </form>
  );
}
