import matter from 'gray-matter'
import type { TaskFrontmatter, Priority } from './types.js'

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high']

export interface ParsedTask {
  frontmatter: TaskFrontmatter
  content: string
}

/**
 * Parse a markdown task file into frontmatter and content
 */
export function parseTask(markdown: string): ParsedTask {
  const { data, content } = matter(markdown)

  // Extract and validate frontmatter
  const frontmatter: TaskFrontmatter = {
    title: typeof data.title === 'string' ? data.title : ''
  }

  // Validate priority
  if (data.priority && VALID_PRIORITIES.includes(data.priority)) {
    frontmatter.priority = data.priority as Priority
  }

  // Parse created date
  if (data.created) {
    // Handle both Date objects and strings
    if (data.created instanceof Date) {
      frontmatter.created = data.created.toISOString().split('T')[0]
    } else if (typeof data.created === 'string') {
      frontmatter.created = data.created
    }
  }

  // Parse tags
  if (Array.isArray(data.tags)) {
    frontmatter.tags = data.tags.map(String)
  }

  return {
    frontmatter,
    content
  }
}

/**
 * Serialize a task to markdown with frontmatter
 */
export function serializeTask(frontmatter: TaskFrontmatter, content: string): string {
  const lines: string[] = ['---']

  // Title is always required
  lines.push(`title: ${frontmatter.title}`)

  // Optional fields
  if (frontmatter.priority) {
    lines.push(`priority: ${frontmatter.priority}`)
  }

  if (frontmatter.created) {
    lines.push(`created: ${frontmatter.created}`)
  }

  if (frontmatter.tags && frontmatter.tags.length > 0) {
    lines.push('tags:')
    for (const tag of frontmatter.tags) {
      lines.push(`  - ${tag}`)
    }
  }

  lines.push('---')
  lines.push('')

  // Add content
  if (content) {
    lines.push(content.trim())
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate a slug from a title
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Convert a slug to a display name
 * e.g., "in-progress" -> "In Progress"
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Parse a column folder name into order and slug
 * e.g., "01-backlog" -> { order: 1, slug: "backlog" }
 */
export function parseColumnFolder(folderName: string): { order: number; slug: string } | null {
  const match = folderName.match(/^(\d+)-(.+)$/)
  if (!match) return null

  return {
    order: parseInt(match[1], 10),
    slug: match[2]
  }
}

/**
 * Create a column folder name from order and slug
 * e.g., { order: 1, slug: "backlog" } -> "01-backlog"
 */
export function createColumnFolder(order: number, slug: string): string {
  return `${String(order).padStart(2, '0')}-${slug}`
}
