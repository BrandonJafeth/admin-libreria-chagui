import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Parse inline formatting: **bold**, *italic*
 */
function parseInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**'))
      return <strong key={i} className="font-semibold">{chunk.slice(2, -2)}</strong>
    if (chunk.startsWith('*') && chunk.endsWith('*'))
      return <em key={i}>{chunk.slice(1, -1)}</em>
    return chunk || null
  })
}

/**
 * Renders markdown string as safe ReactNode tree.
 *
 * Supported syntax:
 *   ## Heading 2        → <h2>
 *   ### Heading 3       → <h3>
 *   **bold**            → <strong>
 *   *italic*            → <em>
 *   - item / • item     → <ul><li>
 *   1. item             → <ol><li>
 *   ---                 → <hr>
 *   blank line          → paragraph break
 */
export function Md({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) return null
  const nodes = renderLines(text.split('\n'))
  return <div className={cn('text-sm leading-relaxed space-y-1.5', className)}>{nodes}</div>
}

function renderLines(lines: string[]): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()

    if (!line) {
      i++
      continue
    }

    if (line.startsWith('## ')) {
      out.push(
        <h2 key={i} className="font-heading font-semibold text-sm text-foreground mt-2 first:mt-0">
          {parseInline(line.slice(3))}
        </h2>,
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      out.push(
        <h3 key={i} className="font-medium text-sm text-foreground">
          {parseInline(line.slice(4))}
        </h3>,
      )
      i++
      continue
    }

    if (line === '---') {
      out.push(<hr key={i} className="border-border/50 my-1" />)
      i++
      continue
    }

    if (/^[-•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2))
        i++
      }
      out.push(
        <ul key={`ul-${i}`} className="list-disc pl-4 space-y-0.5">
          {items.map((b, bi) => <li key={bi}>{parseInline(b)}</li>)}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      out.push(
        <ol key={`ol-${i}`} className="list-decimal pl-4 space-y-0.5">
          {items.map((item, ii) => <li key={ii}>{parseInline(item)}</li>)}
        </ol>,
      )
      continue
    }

    out.push(<p key={i}>{parseInline(line)}</p>)
    i++
  }

  return out
}
