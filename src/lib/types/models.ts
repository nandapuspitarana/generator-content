export interface GeneratorFormData {
  title: string
  author: string
  notes: string
  affiliateLink?: string
  imageUrl?: string
  scheduledAt?: string
}

export interface GeneratorFormState extends GeneratorFormData {
  isLoading: boolean
  error: string | null
}

export interface GenerateContentRequest extends GeneratorFormData {}

export interface ParsedResult {
  htmlBannerCode: string;
  markdownContent: string;
}

export type WritingStyle = 
  | 'santai-storytelling'
  | 'semi-formal-edukatif'
  | 'narasi-investigatif'

export interface KnowledgeTag {
  id: string
  slug: string
  category: string
  type: string
  title: string
  summary?: string
  writingStyle: WritingStyle
  createdAt: string
  updatedAt: string
}

export interface KnowledgeChapter {
  id: string
  tagSlug: string
  chapterNumber: number
  chapterTitle: string
  originalContent: string
  storyVersion?: string
  podcastScript?: string
  createdAt: string
  updatedAt: string
}

export interface ChatSession {
  id: string
  tagSlug: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
