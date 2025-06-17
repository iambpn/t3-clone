import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export function RenderMarkdown({ content }: { content: string }) {
  return (
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
      {content}
    </ReactMarkdown>
  );
}
