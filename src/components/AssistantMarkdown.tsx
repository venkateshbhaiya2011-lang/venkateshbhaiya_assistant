import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

interface AssistantMarkdownProps {
  content: string;
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "code";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 text-zinc-100 text-xs font-mono shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-[11px] text-zinc-400">
        <span className="font-semibold tracking-wide lowercase">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition cursor-pointer"
          title="Copy code"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-sans">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[12.5px] leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export const AssistantMarkdown: React.FC<AssistantMarkdownProps> = ({ content }) => {
  return (
    <div className="assistant-markdown text-[14px] sm:text-[15px] leading-relaxed text-zinc-200 dark:text-zinc-200 space-y-2.5 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-bold text-zinc-100 dark:text-zinc-100 mt-4 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 dark:text-zinc-100 mt-3.5 mb-1.5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-semibold text-zinc-100 dark:text-zinc-100 mt-3 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-zinc-200 dark:text-zinc-200 my-1.5 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 sm:ml-5 space-y-1 my-2 text-zinc-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 sm:ml-5 space-y-1 my-2 text-zinc-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500/50 pl-3.5 py-0.5 my-2.5 text-zinc-400 italic font-normal">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-zinc-800" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs border-collapse divide-y divide-zinc-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900/80 text-zinc-300 font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-zinc-800/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-zinc-900/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-zinc-200 font-medium">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-zinc-300">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition font-medium"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          code: ({ className, children, ...props }) => {
            const isMultiLine = String(children).includes("\n") || className?.startsWith("language-");
            if (isMultiLine) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-amber-300 font-mono text-[12px] border border-zinc-700/50"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
