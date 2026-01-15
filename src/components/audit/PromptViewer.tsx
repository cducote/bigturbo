'use client';

import { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Custom theme matching the design system - monochrome navy on pale yellow
const customTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#0f172a',
    background: 'none',
    fontFamily: 'monospace',
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#0f172a',
    background: '#fffef5',
    fontFamily: 'monospace',
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 2,
    hyphens: 'none',
    padding: '1em',
    margin: '0',
    overflow: 'auto',
  },
  comment: { color: '#64748b' },
  prolog: { color: '#64748b' },
  doctype: { color: '#64748b' },
  cdata: { color: '#64748b' },
  punctuation: { color: '#1e293b' },
  property: { color: '#0f172a' },
  tag: { color: '#0f172a' },
  boolean: { color: '#0f172a', fontWeight: 'bold' },
  number: { color: '#0f172a' },
  constant: { color: '#0f172a' },
  symbol: { color: '#0f172a' },
  deleted: { color: '#0f172a' },
  selector: { color: '#0f172a' },
  'attr-name': { color: '#0f172a' },
  string: { color: '#334155' },
  char: { color: '#334155' },
  builtin: { color: '#0f172a' },
  inserted: { color: '#0f172a' },
  operator: { color: '#1e293b' },
  entity: { color: '#1e293b' },
  url: { color: '#1e293b' },
  atrule: { color: '#0f172a' },
  'attr-value': { color: '#334155' },
  keyword: { color: '#0f172a', fontWeight: 'bold' },
  function: { color: '#0f172a' },
  'class-name': { color: '#0f172a', fontWeight: 'bold' },
  regex: { color: '#334155' },
  important: { color: '#0f172a', fontWeight: 'bold' },
  variable: { color: '#0f172a' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

export interface PromptViewerProps {
  content: string;
  title?: string;
  filePath?: string;
}

interface ParsedBlock {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function parseMarkdownContent(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        blocks.push({ type: 'text', content: textContent });
      }
    }

    // Add code block
    blocks.push({
      type: 'code',
      content: match[2].trim(),
      language: match[1] || 'text',
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      blocks.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, treat entire content as text
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'text', content: content.trim() });
  }

  return blocks;
}

function renderTextBlock(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const key = `line-${index}`;

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={key} className="mb-2 mt-4 text-sm font-bold text-[#0f172a]">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key} className="mb-2 mt-4 text-base font-bold text-[#0f172a]">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={key} className="mb-3 mt-4 text-lg font-bold text-[#0f172a]">
          {line.slice(2)}
        </h2>
      );
    }
    // List items
    else if (line.match(/^[-*]\s/)) {
      elements.push(
        <li key={key} className="ml-4 text-sm text-[#1e293b]">
          {renderInlineFormatting(line.slice(2))}
        </li>
      );
    }
    // Numbered lists
    else if (line.match(/^\d+\.\s/)) {
      elements.push(
        <li key={key} className="ml-4 text-sm text-[#1e293b]">
          {renderInlineFormatting(line.replace(/^\d+\.\s/, ''))}
        </li>
      );
    }
    // Empty lines
    else if (line.trim() === '') {
      elements.push(<div key={key} className="h-2" />);
    }
    // Regular paragraphs
    else {
      elements.push(
        <p key={key} className="text-sm text-[#1e293b]">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  return <>{elements}</>;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Handle bold, inline code, and links
  const parts: React.ReactNode[] = [];

  // Process inline code first
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  const tempParts: { type: 'text' | 'code'; content: string }[] = [];

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tempParts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    tempParts.push({ type: 'code', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tempParts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (tempParts.length === 0) {
    tempParts.push({ type: 'text', content: text });
  }

  // Now process bold in text parts
  tempParts.forEach((part, idx) => {
    if (part.type === 'code') {
      parts.push(
        <code
          key={`code-${idx}`}
          className="border border-[#1e293b] bg-[#fffef5] px-1 text-xs"
        >
          {part.content}
        </code>
      );
    } else {
      // Process bold
      const boldParts = part.content.split(/\*\*(.*?)\*\*/g);
      boldParts.forEach((boldPart, boldIdx) => {
        if (boldIdx % 2 === 1) {
          parts.push(
            <strong key={`bold-${idx}-${boldIdx}`} className="font-bold">
              {boldPart}
            </strong>
          );
        } else if (boldPart) {
          parts.push(<span key={`text-${idx}-${boldIdx}`}>{boldPart}</span>);
        }
      });
    }
  });

  return <>{parts}</>;
}

export function PromptViewer({ content, title, filePath }: PromptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const blocks = useMemo(() => parseMarkdownContent(content), [content]);
  const lineCount = content.split('\n').length;

  // Collapse threshold: content longer than 20 lines or 1000 chars
  const isLongContent = lineCount > 20 || content.length > 1000;
  const canCollapse = isLongContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // For collapsed view, truncate content to first ~500 chars
  const truncatedContent = useMemo(() => {
    if (isExpanded || !canCollapse) return content;
    const lines = content.split('\n').slice(0, 15);
    return lines.join('\n') + (lineCount > 15 ? '\n...' : '');
  }, [content, isExpanded, canCollapse, lineCount]);

  const visibleBlocks = useMemo(
    () => parseMarkdownContent(truncatedContent),
    [truncatedContent]
  );

  return (
    <div className="border border-[#1e293b] bg-[#fefcf3] font-mono">
      {/* Header */}
      {(title || filePath) && (
        <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-2">
          <div>
            {title && <h3 className="font-bold text-[#0f172a]">{title}</h3>}
            {filePath && (
              <p className="mt-0.5 text-xs text-[#1e293b] opacity-60">{filePath}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="border border-[#1e293b] px-2 py-1 text-xs text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3]"
              style={{ borderRadius: 0 }}
            >
              {isCopied ? 'copied!' : 'copy'}
            </button>
            {canCollapse && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="border border-[#1e293b] px-2 py-1 text-xs text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3]"
                style={{ borderRadius: 0 }}
              >
                {isExpanded ? 'collapse' : 'expand'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {visibleBlocks.map((block, index) => (
          <div key={index} className="mb-4 last:mb-0">
            {block.type === 'code' ? (
              <div className="border border-[#1e293b]">
                <div className="border-b border-[#1e293b] bg-[#fffef5] px-2 py-1 text-xs text-[#1e293b] opacity-60">
                  {block.language || 'code'}
                </div>
                <SyntaxHighlighter
                  language={block.language || 'text'}
                  style={customTheme}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    background: '#fffef5',
                  }}
                >
                  {block.content}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div>{renderTextBlock(block.content)}</div>
            )}
          </div>
        ))}

        {!isExpanded && canCollapse && (
          <div className="mt-4 border-t border-dashed border-[#1e293b]/30 pt-4 text-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-[#1e293b] opacity-60 hover:opacity-100"
            >
              {'\u22ef'} {lineCount - 15} more lines
            </button>
          </div>
        )}

        {blocks.length === 0 && (
          <div className="py-4 text-center text-sm text-[#1e293b] opacity-60">
            {'\u00f8'} no content
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e293b] px-4 py-2 text-xs text-[#1e293b] opacity-60">
        {lineCount} lines | {content.length} chars
      </div>
    </div>
  );
}
