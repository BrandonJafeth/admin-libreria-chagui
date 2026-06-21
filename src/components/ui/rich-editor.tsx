import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, List, ListOrdered, Heading2, Minus,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * Make Enter at end of a heading create a normal paragraph instead of
 * splitting the heading.
 */
const HeadingBreakToP = Extension.create({
  name: 'headingBreakToP',
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor
        const { $from } = state.selection
        if ($from.parent.type.name !== 'heading') return false
        // At end of heading → insert paragraph below
        if ($from.parentOffset === $from.parent.content.size) {
          return this.editor
            .chain()
            .insertContentAt($from.after(), { type: 'paragraph' })
            .focus($from.after() + 1)
            .run()
        }
        // In middle → split heading (default)
        return false
      },
    }
  },
})

interface RichEditorProps {
  value?: string
  onChange?: (html: string) => void
  onBlur?: () => void
  placeholder?: string
  visibleMax?: number
  disabled?: boolean
  'aria-invalid'?: boolean
}

function ToolbarBtn({
  icon: Icon,
  title,
  onClick,
  active,
  disabled,
}: {
  icon: React.ElementType
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        // Prevent editor from losing focus/selection on button click
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-xs transition-colors',
        active
          ? 'bg-accent text-white'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

export function RichEditor({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Escribe aquí…',
  visibleMax,
  disabled,
  'aria-invalid': ariaInvalid,
}: RichEditorProps) {
  // Track what HTML this editor last emitted so we don't re-apply it
  // back to the editor (which resets cursor/selection every keystroke).
  const lastEmittedHtml = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      HeadingBreakToP,
    ],
    content: value || '',
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML()
      lastEmittedHtml.current = html
      onChange?.(html)
    },
    onBlur() {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content min-h-[120px] px-3 py-2.5 focus:outline-none',
      },
    },
  })

  // Only sync content when value changes from OUTSIDE (e.g. loading existing product,
  // form reset). If the value matches what we emitted, it's our own update — skip.
  useEffect(() => {
    if (!editor) return
    const incoming = value || ''
    if (incoming === lastEmittedHtml.current) return   // came from us, skip
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (incoming !== current) {
      lastEmittedHtml.current = incoming
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [value, editor])

  useEffect(() => {
    if (editor) editor.setEditable(!disabled)
  }, [disabled, editor])

  const visibleLen = editor?.getText().length ?? 0
  const nearLimit = visibleMax != null && visibleLen > visibleMax * 0.85
  const overLimit  = visibleMax != null && visibleLen > visibleMax

  return (
    <div
      className={cn(
        'overflow-hidden border border-input bg-card text-sm',
        ariaInvalid && 'border-destructive ring-2 ring-destructive/30',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 border-b border-input bg-muted/40 px-2 py-1">
        <ToolbarBtn
          icon={Bold}
          title="Negrita (Ctrl+B)"
          active={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={disabled}
        />
        <ToolbarBtn
          icon={Italic}
          title="Itálica (Ctrl+I)"
          active={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={disabled}
        />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <ToolbarBtn
          icon={Heading2}
          title="Encabezado"
          active={editor?.isActive('heading', { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        />
        <ToolbarBtn
          icon={List}
          title="Lista con viñetas"
          active={editor?.isActive('bulletList')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        />
        <ToolbarBtn
          icon={ListOrdered}
          title="Lista numerada"
          active={editor?.isActive('orderedList')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        />
        <ToolbarBtn
          icon={Minus}
          title="Línea separadora"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
        />
        {visibleMax != null && (
          <span
            className={cn(
              'ml-auto text-[11px] tabular-nums',
              overLimit  ? 'text-destructive'  :
              nearLimit  ? 'text-amber-500'    :
                           'text-muted-foreground',
            )}
          >
            {visibleLen}/{visibleMax}
          </span>
        )}
      </div>

      {/* ── Editor ── */}
      <EditorContent editor={editor} />
    </div>
  )
}
