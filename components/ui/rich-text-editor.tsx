"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Smile,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
}

// Common emojis for quick access
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
  '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌈', '☀️', '🌤️'
]

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className,
  maxLength = 5000
}: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const linkDialogRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close emoji picker and link dialog
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (linkDialogRef.current && !linkDialogRef.current.contains(event.target as Node)) {
        setShowLinkDialog(false)
      }
    }

    if (showEmojiPicker || showLinkDialog) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker, showLinkDialog])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
          style: 'display: block !important; visibility: visible !important;',
        },
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#4DA2FF] hover:text-[#4DA2FF]/80 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration issues
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
          'min-h-[120px] max-w-none p-4 text-white',
          'prose-headings:text-white prose-p:text-white prose-strong:text-white',
          'prose-em:text-white prose-code:text-white prose-pre:bg-[#1a2f51]',
          'prose-blockquote:text-white prose-blockquote:border-l-[#4DA2FF]',
          'prose-ul:text-white prose-ol:text-white prose-li:text-white',
          'prose-img:block prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:my-4'
        ),
      },
    },
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('🔄 Updating editor content:', {
        newContentLength: content?.length,
        currentContentLength: editor.getHTML()?.length,
        hasImages: content?.includes('<img') || content?.includes('data:image')
      })
      editor.commands.setContent(content)
      // Don't manipulate focus here as it interferes with typing
    }
  }, [editor, content])

  const addEmoji = useCallback((emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run()
      setShowEmojiPicker(false)
    }
  }, [editor])

  const addLink = useCallback(() => {
    if (editor && linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkDialog(false)
    }
  }, [editor, linkUrl])

  const addImage = useCallback((file: File) => {
    if (editor && file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        editor.chain().focus().setImage({ src }).run()
        console.log('📷 Image added successfully')
      }
      reader.readAsDataURL(file)
    }
  }, [editor])

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      addImage(file)
    }
  }, [addImage])

  if (!editor) {
    return null
  }

  const characterCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()

  return (
    <div className={cn("border border-[#C0E6FF]/20 rounded-lg bg-[#1a2f51] relative", className)}>
      {/* Toolbar */}
      <div className="border-b border-[#C0E6FF]/20 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20",
            editor.isActive('bold') && "bg-[#4DA2FF]/30"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20",
            editor.isActive('italic') && "bg-[#4DA2FF]/30"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20",
            editor.isActive('strike') && "bg-[#4DA2FF]/30"
          )}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#C0E6FF]/20 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20",
            editor.isActive('bulletList') && "bg-[#4DA2FF]/30"
          )}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20",
            editor.isActive('orderedList') && "bg-[#4DA2FF]/30"
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20",
            editor.isActive('blockquote') && "bg-[#4DA2FF]/30"
          )}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#C0E6FF]/20 mx-1" />

        {/* Media & Links */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkDialog(true)}
          className="h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
          className="h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20"
        >
          <Smile className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-[#C0E6FF]/20 mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20 disabled:opacity-50"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0 text-[#C0E6FF] hover:bg-[#4DA2FF]/20 disabled:opacity-50"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character Count */}
      <div className="border-t border-[#C0E6FF]/20 p-2 flex justify-between items-center text-xs text-[#C0E6FF]/70">
        <span>{wordCount} words</span>
        <span className={cn(
          characterCount > maxLength * 0.9 && "text-orange-400",
          characterCount >= maxLength && "text-red-400"
        )}>
          {characterCount}/{maxLength} characters
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute z-50 top-full mt-2 left-0 p-4 bg-[#030f1c] border border-[#C0E6FF]/20 rounded-lg shadow-lg max-w-xs"
        >
          <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
            {COMMON_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-lg hover:bg-[#1a2f51] p-1 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div
          ref={linkDialogRef}
          className="absolute z-50 top-full mt-2 left-0 p-4 bg-[#030f1c] border border-[#C0E6FF]/20 rounded-lg shadow-lg"
        >
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-[#1a2f51] border-[#C0E6FF]/20 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
            />
            <Button
              type="button"
              onClick={addLink}
              size="sm"
              className="bg-[#4DA2FF] hover:bg-[#4DA2FF]/80"
            >
              Add
            </Button>
            <Button
              type="button"
              onClick={() => setShowLinkDialog(false)}
              size="sm"
              variant="outline"
              className="border-[#C0E6FF]/30 text-[#C0E6FF]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
