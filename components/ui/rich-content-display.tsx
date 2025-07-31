"use client"

import { cn } from '@/lib/utils'

interface RichContentDisplayProps {
  content: string
  contentType: 'text' | 'markdown' | 'html'
  className?: string
}

// Simple markdown to HTML converter for basic markdown support
const markdownToHtml = (markdown: string): string => {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/__(.*?)__/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/_(.*?)_/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#4DA2FF] hover:text-[#4DA2FF]/80 underline">$1</a>')
    // Line breaks
    .replace(/\n/gim, '<br>')
}

// Simple HTML sanitization for client-side safety
const sanitizeHtml = (html: string): string => {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, 'data:text/plain')
}

export function RichContentDisplay({ content, contentType, className }: RichContentDisplayProps) {
  const getDisplayContent = (): string => {
    // Auto-detect HTML content if it contains HTML tags
    const isHtmlContent = content.includes('<') && content.includes('>')

    // If content looks like HTML but contentType is 'text', treat it as HTML
    const actualContentType = isHtmlContent && contentType === 'text' ? 'html' : contentType

    switch (actualContentType) {
      case 'html':
        return sanitizeHtml(content)
      case 'markdown':
        return markdownToHtml(content)
      case 'text':
      default:
        // Escape HTML entities and convert line breaks
        return content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\n/g, '<br>')
    }
  }

  const displayContent = getDisplayContent()

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-white',
        'prose-headings:text-white prose-p:text-white prose-strong:text-white',
        'prose-em:text-white prose-code:text-white',
        'prose-blockquote:text-white prose-blockquote:border-l-[#4DA2FF]',
        'prose-ul:text-white prose-ol:text-white prose-li:text-white',
        'prose-a:text-[#4DA2FF] prose-a:hover:text-[#4DA2FF]/80',
        'prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto',
        // Custom styles for rich content
        '[&_p]:mb-2 [&_p]:leading-relaxed',
        '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4',
        '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3',
        '[&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3',
        '[&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2',
        '[&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2',
        '[&_li]:mb-1',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-[#4DA2FF] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3',
        '[&_img]:my-3 [&_img]:rounded-lg [&_img]:shadow-lg',
        '[&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-2',
        '[&_strong]:font-semibold',
        '[&_em]:italic',
        // Emoji styling
        '[&_span]:inline-block',
        className
      )}
      dangerouslySetInnerHTML={{ __html: displayContent }}
    />
  )
}
