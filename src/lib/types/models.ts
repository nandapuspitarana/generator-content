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
