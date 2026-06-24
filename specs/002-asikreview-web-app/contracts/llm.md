# LLM Service Contract

**File**: `src/lib/services/llm.ts`

```typescript
export interface GenerateContentRequest {
  title: string;
  author: string;
  notes?: string;
}

export interface GenerateContentResponse {
  htmlBannerCode: string;
  markdownContent: string;
}

/**
 * Service function to interact with the LLM API.
 * Currently mocked to return predictable structure for UI development.
 */
export async function generateContent(req: GenerateContentRequest): Promise<GenerateContentResponse> {
  // To be implemented: API call or mock logic
}
```

## System Prompt Requirements
The LLM mock (and future real implementation) MUST return an `htmlBannerCode` that closely matches the structure and aesthetic of the template file provided by the user:
- **Reference Template**: `example/book_review_banner_with_img.html`
- **Key Characteristics**: 16:9 aspect ratio, split left/right layout (content vs image), minimalist typography, `clamp()` fluid font sizing, inline styles for robustness.
