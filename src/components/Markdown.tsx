import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

interface MarkdownProps {
  content: string;
}

/**
 * Markdown - Component for rendering markdown content
 *
 * Features:
 * - GitHub Flavored Markdown support (tables, strikethrough, task lists)
 * - Syntax highlighting for code blocks
 * - Custom styling for code blocks
 * - Responsive and accessible
 *
 * Uses:
 * - react-markdown for markdown parsing
 * - remark-gfm for GitHub Flavored Markdown
 * - rehype-highlight for syntax highlighting
 */
export function Markdown({ content }: MarkdownProps) {
  // Custom components for better styling
  const components: Components = {
    // Style code blocks with background
    pre: ({ children, ...props }) => (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm max-w-full" {...props}>
        {children}
      </pre>
    ),
    // Inline code styling
    code: ({ className, children, ...props }) => {
      // Check if it's a code block (has language class) or inline code
      const isCodeBlock = /language-(\w+)/.test(className || "");

      if (isCodeBlock) {
        // Code block - handled by pre tag
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      // Inline code
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="prose prose-sm dark:prose-invert w-full min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
