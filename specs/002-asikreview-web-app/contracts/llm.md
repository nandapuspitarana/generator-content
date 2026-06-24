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
