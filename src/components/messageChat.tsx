import type { api } from "convex/_generated/api";
import { Card } from "./ui/card";

type Props = {
  message: (typeof api.chat.getConversationMessages._returnType)[number];
};
export function MessageChat({ message }: Props) {
  return (
    <div key={message._id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} mt-2`}>
      {message.role === "user" && (
        <div className='max-w-[60%] py-5'>
          <Card
            className={`p-2 rounded-3xl px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg`}
          >
            <div className='max-w-none prose prose-sm dark:prose-invert'>
              <p className={`m-0 leading-relaxed text-white`}>{message.content}</p>
            </div>
          </Card>
        </div>
      )}

      {message.role === "assistant" && (
        <div className='w-full prose prose-sm dark:prose-invert py-5'>
          <p className={`m-0 leading-relaxed text-foreground`}>{message.content}</p>
        </div>
      )}
    </div>
  );
}
