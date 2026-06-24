# Data Model

## Generator Form State
```typescript
interface GeneratorFormState {
  title: string;       // Book title
  author: string;      // Book author
  notes: string;       // Optional user notes
  isLoading: boolean;  // UI state for async call
  error: string | null;// Error message if any
}
```

## LLM Output State
```typescript
interface ParsedResult {
  htmlBannerCode: string;   // Extracted HTML code for the banner
  markdownContent: string;  // The remaining 7-page review Markdown
}
```
