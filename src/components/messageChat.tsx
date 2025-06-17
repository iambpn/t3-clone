import type { api } from "convex/_generated/api";
import { Card } from "./ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "github-markdown-css/github-markdown-dark.css";
import "highlight.js/styles/github-dark.min.css";

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
          <div className={`m-0 leading-relaxed text-foreground markdown-body bg-transparent!`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                pre: ({ node, ...props }) => (
                  <pre {...props} className='p-1! mt-2!'>
                    {props.children}
                  </pre>
                ),
                hr: ({ node, ...props }) => <hr {...props} className='h-0.5!' />,
                ul: ({ node, ...props }) => (
                  <ul {...props} className='list-disc'>
                    {props.children}
                  </ul>
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className='list-decimal'>
                    {props.children}
                  </ol>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* show error message */}
            {message.errorMessage && (
              <div className='text-red-500 mt-2'>
                <strong>Error:</strong> {message.errorMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
