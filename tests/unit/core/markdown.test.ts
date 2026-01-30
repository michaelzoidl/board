import { describe, it, expect } from 'vitest'
import { parseTask, serializeTask } from '../../../src/core/markdown.js'
import type { TaskFrontmatter } from '../../../src/core/types.js'

describe('markdown parser', () => {
  describe('parseTask', () => {
    it('parses frontmatter with all fields', () => {
      const content = `---
title: Implement user authentication
priority: high
created: 2024-01-27
tags: [backend, security]
---

## Description

Add JWT-based authentication flow.
`
      const result = parseTask(content)

      expect(result.frontmatter.title).toBe('Implement user authentication')
      expect(result.frontmatter.priority).toBe('high')
      expect(result.frontmatter.created).toBe('2024-01-27')
      expect(result.frontmatter.tags).toEqual(['backend', 'security'])
      expect(result.content.trim()).toBe('## Description\n\nAdd JWT-based authentication flow.')
    })

    it('parses frontmatter with only required fields', () => {
      const content = `---
title: Simple task
---

Some content here.
`
      const result = parseTask(content)

      expect(result.frontmatter.title).toBe('Simple task')
      expect(result.frontmatter.priority).toBeUndefined()
      expect(result.frontmatter.created).toBeUndefined()
      expect(result.frontmatter.tags).toBeUndefined()
      expect(result.content.trim()).toBe('Some content here.')
    })

    it('handles empty content', () => {
      const content = `---
title: Empty task
---
`
      const result = parseTask(content)

      expect(result.frontmatter.title).toBe('Empty task')
      expect(result.content.trim()).toBe('')
    })

    it('handles content without frontmatter', () => {
      const content = `Just some markdown without frontmatter.`

      const result = parseTask(content)

      // Should use empty title and treat everything as content
      expect(result.frontmatter.title).toBe('')
      expect(result.content.trim()).toBe('Just some markdown without frontmatter.')
    })

    it('parses tags as array when given inline', () => {
      const content = `---
title: Task with inline tags
tags: [one, two, three]
---

Content.
`
      const result = parseTask(content)
      expect(result.frontmatter.tags).toEqual(['one', 'two', 'three'])
    })

    it('parses tags as array when given as list', () => {
      const content = `---
title: Task with list tags
tags:
  - one
  - two
  - three
---

Content.
`
      const result = parseTask(content)
      expect(result.frontmatter.tags).toEqual(['one', 'two', 'three'])
    })

    it('validates priority values', () => {
      const validPriorities = ['low', 'medium', 'high']

      for (const priority of validPriorities) {
        const content = `---
title: Task
priority: ${priority}
---
`
        const result = parseTask(content)
        expect(result.frontmatter.priority).toBe(priority)
      }
    })

    it('ignores invalid priority values', () => {
      const content = `---
title: Task
priority: invalid
---
`
      const result = parseTask(content)
      expect(result.frontmatter.priority).toBeUndefined()
    })
  })

  describe('serializeTask', () => {
    it('serializes task with all fields', () => {
      const frontmatter: TaskFrontmatter = {
        title: 'Test task',
        priority: 'high',
        created: '2024-01-27',
        tags: ['backend', 'api']
      }
      const content = '## Description\n\nThis is a test.'

      const result = serializeTask(frontmatter, content)

      expect(result).toContain('title: Test task')
      expect(result).toContain('priority: high')
      expect(result).toContain('created: 2024-01-27')
      expect(result).toContain('tags:')
      expect(result).toContain('- backend')
      expect(result).toContain('- api')
      expect(result).toContain('## Description')
      expect(result).toContain('This is a test.')
    })

    it('serializes task with only required fields', () => {
      const frontmatter: TaskFrontmatter = {
        title: 'Simple task'
      }
      const content = 'Content here.'

      const result = serializeTask(frontmatter, content)

      expect(result).toContain('title: Simple task')
      expect(result).not.toContain('priority:')
      expect(result).not.toContain('created:')
      expect(result).not.toContain('tags:')
      expect(result).toContain('Content here.')
    })

    it('serializes empty tags as nothing', () => {
      const frontmatter: TaskFrontmatter = {
        title: 'Task',
        tags: []
      }
      const content = 'Content.'

      const result = serializeTask(frontmatter, content)

      expect(result).not.toContain('tags:')
    })

    it('roundtrips correctly', () => {
      const original = `---
title: Roundtrip test
priority: medium
created: 2024-01-27
tags:
  - test
  - roundtrip
---

## Content

This should roundtrip correctly.
`
      const parsed = parseTask(original)
      const serialized = serializeTask(parsed.frontmatter, parsed.content)
      const reparsed = parseTask(serialized)

      expect(reparsed.frontmatter.title).toBe(parsed.frontmatter.title)
      expect(reparsed.frontmatter.priority).toBe(parsed.frontmatter.priority)
      expect(reparsed.frontmatter.created).toBe(parsed.frontmatter.created)
      expect(reparsed.frontmatter.tags).toEqual(parsed.frontmatter.tags)
      expect(reparsed.content.trim()).toBe(parsed.content.trim())
    })
  })
})
