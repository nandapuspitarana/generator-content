# Implementation Plan: AsikReview Generator Web App

**Branch**: `002-asikreview-web-app` | **Date**: 2026-06-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-asikreview-web-app/spec.md`

## Summary

Build a Single-Page Web Application for "AsikReview Generator" using Next.js (App Router) and Tailwind CSS. The UI will feature a minimalist form to capture book details, an aesthetic loading state, and a dual-panel layout rendering an HTML banner preview alongside a 7-page Markdown review using `react-markdown`. A mock LLM service will be implemented to abstract API integrations.

## Technical Context

**Language/Version**: TypeScript, React 18+  
**Primary Dependencies**: Next.js (App Router), Tailwind CSS, `react-markdown`, `lucide-react` (for icons)  
**Storage**: N/A (Stateless, client-side rendering of API response)  
**Testing**: Jest / React Testing Library  
**Target Platform**: Web (Vercel or Node.js host)  
**Project Type**: Single-Page Web Application  
**Performance Goals**: Fast Time-To-Interactive (TTI), responsive rendering  
**Constraints**: HTML Banner rendered safely (`dangerouslySetInnerHTML` with basic sanitation or isolated `iframe`), Markdown parsing must not break UI layout.  
**Scale/Scope**: Initial MVP focusing on the UI flow and mock LLM service abstraction.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
- **Ultra-Minimalist UI**: Adhered to by using Tailwind utility classes with ample whitespace.
- **Clean Architecture**: `generateContent` service abstracted from UI components.
- **Robust LLM Error Handling**: Handled via try-catch in the form submission with fallback UI.
- **Flawless Markdown**: Achieved via `react-markdown`.

## Project Structure

### Documentation (this feature)

```text
specs/002-asikreview-web-app/
├── plan.md              # This file
├── research.md          # Technical decisions and rationale
├── data-model.md        # Interfaces and data structures
├── quickstart.md        # Setup instructions
└── contracts/           # API service contracts
```

### Source Code

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                # Shadcn-like minimal components (Button, Input, Textarea)
│   ├── generator-form.tsx # Form component
│   ├── banner-preview.tsx # HTML rendering component
│   └── review-viewer.tsx  # React-markdown component
└── lib/
    ├── services/
    │   └── llm.ts         # generateContent(title, author, notes) abstraction
    └── utils.ts           # Tailwind cn() utility
```

**Structure Decision**: Selected standard Next.js `app/` directory with a clear separation of UI components and the LLM service layer.
