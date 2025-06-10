import { AppConstants } from "@/constants/app.constant";
import { Bot } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  showDescription?: boolean;
  descriptionUI?: ReactNode;
};

export default function WelcomeMessage({ showDescription, descriptionUI }: Props) {
  return (
    <div className='flex flex-col items-center justify-center h-full text-center'>
      <div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6'>
        <Bot className='w-10 h-10 text-white' />
      </div>
      <h2 className='text-3xl font-bold text-foreground mb-3'>Welcome to {AppConstants.APP_NAME}</h2>
      {showDescription && !descriptionUI && (
        <p className='text-muted-foreground max-w-md text-lg'>
          Start a conversation with our AI assistant. Ask questions, get help, or just chat!
        </p>
      )}
      {showDescription && descriptionUI && <>{descriptionUI}</>}
    </div>
  );
}
