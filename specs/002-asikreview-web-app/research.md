# Research & Decisions

## UI Framework & Styling
- **Decision**: Next.js (App Router) + Tailwind CSS.
- **Rationale**: The standard stack for React applications, providing built-in routing, fast hydration, and simple minimalist styling with utility classes. Next.js supports seamless API routes if a backend is needed later.
- **Alternatives considered**: Vite + React SPA. Rejected because Next.js provides better scalability and standard patterns for routing.

## Markdown Rendering
- **Decision**: `react-markdown` with Tailwind Typography (`@tailwindcss/typography`).
- **Rationale**: `react-markdown` securely renders standard markdown. The typography plugin ensures the output matches the "Medium-style" elegant aesthetic natively.
- **Alternatives considered**: `marked.js` with `dangerouslySetInnerHTML`. Rejected due to XSS risks.

## HTML Banner Rendering
- **Decision**: `dangerouslySetInnerHTML` inside a styled `div` container.
- **Rationale**: Tailwind CDN classes returned by the LLM require rendering as raw HTML. A scoped container with aspect-ratio 16:9 ensures layout stability.
- **Alternatives considered**: `iframe` with `srcDoc`. Will be evaluated if CSS scope leak becomes an issue.

## LLM Abstraction
- **Decision**: Create a `generateContent` service in `lib/services/llm.ts`.
- **Rationale**: Decouples the UI from the LLM provider. Allows easy testing via mocked data now, and a drop-in replacement with OpenAI SDK later.
- **Alternatives considered**: Direct API calls from React components. Rejected due to tight coupling and poor architecture.
