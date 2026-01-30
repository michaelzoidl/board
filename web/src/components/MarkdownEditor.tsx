import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchFiles } from '../api'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Render markdown with visible syntax but styled
function renderMarkdownPreview(text: string): string {
  if (!text) return ''

  let result = text
  // Bold **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<span class="md-bold">**$1**</span>')
  // Italic *text* or _text_
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<span class="md-italic">*$1*</span>')
  result = result.replace(/_(.+?)_/g, '<span class="md-italic">_$1_</span>')
  // Code `text`
  result = result.replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>')
  // Headings ## text
  result = result.replace(/^(#{1,3}\s.+)$/gm, '<span class="md-heading">$1</span>')
  // Links [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[$1]($2)</span>')
  // File mentions @path
  result = result.replace(/@([\w/.-]+)/g, '<span class="md-file">@$1</span>')

  return result
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mentions, setMentions] = useState<string[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionPos, setMentionPos] = useState<{ top: number; left: number } | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fetchIdRef = useRef(0)

  // Fetch files when mention query changes
  useEffect(() => {
    if (mentionQuery === null) {
      setMentions([])
      return
    }

    const fetchId = ++fetchIdRef.current
    setLoading(true)

    fetchFiles(mentionQuery).then((res) => {
      // Only update if this is still the latest request
      if (fetchId === fetchIdRef.current) {
        setMentions(res.files || [])
        setSelectedIdx(0)
        setLoading(false)
      }
    }).catch(() => {
      if (fetchId === fetchIdRef.current) {
        setMentions([])
        setLoading(false)
      }
    })
  }, [mentionQuery])

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value
      onChange(text)

      const pos = e.target.selectionStart
      const beforeCursor = text.slice(0, pos)
      const match = beforeCursor.match(/@([\w/.-]*)$/)

      if (match) {
        const query = match[1]
        setMentionQuery(query)

        // Calculate dropdown position
        const lines = beforeCursor.split('\n')
        const lineHeight = 21
        const charWidth = 7.8
        const top = Math.min(lines.length * lineHeight, 200)
        const left = Math.min(lines[lines.length - 1].length * charWidth, 200)

        setMentionPos({ top: top + 16, left })
      } else {
        setMentionQuery(null)
        setMentionPos(null)
      }
    },
    [onChange]
  )

  const insertMention = useCallback(
    (file: string) => {
      if (!textareaRef.current) return

      const pos = textareaRef.current.selectionStart
      const beforeCursor = value.slice(0, pos)
      const match = beforeCursor.match(/@([\w/.-]*)$/)

      if (match) {
        const start = pos - match[0].length
        // Remove trailing slash for directories when inserting
        const cleanFile = file.endsWith('/') ? file.slice(0, -1) : file
        const newText = value.slice(0, start) + '@' + cleanFile + ' ' + value.slice(pos)
        onChange(newText)
      }

      setMentions([])
      setMentionQuery(null)
      setMentionPos(null)
      textareaRef.current.focus()
    },
    [value, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (mentionQuery !== null && mentionPos) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIdx((i) => Math.min(i + 1, mentions.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIdx((i) => Math.max(i - 1, 0))
        } else if ((e.key === 'Enter' || e.key === 'Tab') && mentions.length > 0) {
          e.preventDefault()
          insertMention(mentions[selectedIdx])
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          setMentions([])
          setMentionQuery(null)
          setMentionPos(null)
        }
      }
    },
    [mentions, mentionQuery, mentionPos, selectedIdx, insertMention]
  )

  const previewHtml =
    renderMarkdownPreview(value) ||
    `<span style="color: var(--text-muted)">${placeholder || ''}</span>`

  return (
    <div className="editor-wrap" ref={wrapRef}>
      <textarea
        ref={textareaRef}
        className="editor"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ color: 'transparent', caretColor: 'var(--text)' }}
      />
      <div
        className="editor-preview"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
      {mentionQuery !== null && mentionPos && (
        <div
          className="mention-dropdown"
          style={{ top: mentionPos.top, left: mentionPos.left }}
        >
          {loading && <div className="mention-loading">Loading...</div>}
          {!loading && mentions.length === 0 && (
            <div className="mention-empty">No files found</div>
          )}
          {mentions.map((file, i) => (
            <button
              key={file}
              className={`mention-item ${i === selectedIdx ? 'selected' : ''}`}
              onClick={() => insertMention(file)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              {file}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
