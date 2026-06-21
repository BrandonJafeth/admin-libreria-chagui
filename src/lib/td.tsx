import type { ReactNode } from 'react'

/**
 * Mini-markdown → JSX for sileo toast descriptions.
 * Supports: **bold**, *italic*, - bullets, blank-line paragraphs.
 *
 * Usage:
 *   sileo.success({ title: 'Guardado', description: td('**Listo**\n- Paso 1\n- Paso 2') })
 */

function parseInline(text: string): ReactNode[] {
  // Split on **bold** and *italic* tokens
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**'))
      return <strong key={i} className="font-semibold">{chunk.slice(2, -2)}</strong>
    if (chunk.startsWith('*') && chunk.endsWith('*'))
      return <em key={i}>{chunk.slice(1, -1)}</em>
    return chunk
  })
}

export function td(text: string): ReactNode {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let bullets: string[] = []

  function flushBullets() {
    if (!bullets.length) return
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="mt-0.5 space-y-0.5 list-disc pl-3.5">
        {bullets.map((b, i) => <li key={i}>{parseInline(b)}</li>)}
      </ul>,
    )
    bullets = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('• ')) {
      bullets.push(line.replace(/^\s*[-•]\s/, ''))
    } else {
      flushBullets()
      const trimmed = line.trim()
      if (trimmed) {
        nodes.push(
          <span key={`p-${nodes.length}`} className="block leading-snug">
            {parseInline(trimmed)}
          </span>,
        )
      }
    }
  }
  flushBullets()

  if (nodes.length === 0) return null
  if (nodes.length === 1) return nodes[0]
  return <div className="space-y-1">{nodes}</div>
}
