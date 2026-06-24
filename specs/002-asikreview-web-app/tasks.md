# Tasks: AsikReview Generator Web App

**Input**: Design documents from `/specs/002-asikreview-web-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js (App Router) project with Tailwind CSS
- [ ] T002 [P] Install dependencies: `react-markdown`, `@tailwindcss/typography`, `lucide-react`
- [ ] T003 [P] Configure Tailwind typography plugin in `tailwind.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create base layout and global CSS in `src/app/layout.tsx` and `src/app/globals.css`
- [ ] T005 [P] Create `GeneratorFormState` and `ParsedResult` interfaces in `src/lib/types/models.ts`
- [ ] T006 [P] Setup basic generic UI components (Input, Button, Textarea) in `src/components/ui/`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Mengisi Form & Melihat Loading State (Priority: P1) 🎯 MVP

**Goal**: Form input minimalis (Judul Buku, Penulis, Catatan) dan tombol eksekusi dengan loading state.

**Independent Test**: Buka aplikasi, isi form, tekan Generate, dan pastikan animasi loading muncul sebelum respons diterima.

### Implementation for User Story 1

- [ ] T007 [US1] Implement `GeneratorForm` component in `src/components/generator-form.tsx`
- [ ] T008 [US1] Add aesthetic loading skeleton/spinner state in `src/components/generator-form.tsx`
- [ ] T009 [US1] Integrate form state into the main page layout in `src/app/page.tsx`

**Checkpoint**: User Story 1 fully functional.

---

## Phase 4: User Story 2 - Menampilkan Dua Panel Hasil Secara Bersamaan (Priority: P1)

**Goal**: Split-screen 2-panel layout (Banner HTML dan Markdown Viewer).

**Independent Test**: Gunakan state data mock, verifikasi Panel 1 merender HTML dan Panel 2 merender Markdown tanpa merusak tata letak.

### Implementation for User Story 2

- [ ] T010 [P] [US2] Implement `BannerPreview` component using `dangerouslySetInnerHTML` in `src/components/banner-preview.tsx`
- [ ] T011 [P] [US2] Implement `ReviewViewer` component using `react-markdown` in `src/components/review-viewer.tsx`
- [ ] T012 [US2] Implement dual-panel responsive layout in `src/app/page.tsx` to display parsed results

**Checkpoint**: Both User Story 1 and 2 are functional independently.

---

## Phase 5: User Story 3 - Integrasi Prompt "AsikReview Engine" (Priority: P2)

**Goal**: Menyuntikkan prompt rahasia ke backend dan memisahkan (parse) string HTML/Markdown.

**Independent Test**: Submit form, verifikasi payload dikirim ke API, backend mengembalikan 2 bagian data sesuai kontrak, dan UI menanganinya dengan sempurna atau memunculkan error state jika gagal.

### Implementation for User Story 3

- [ ] T013 [P] [US3] Create mock LLM service abstraction `generateContent` in `src/lib/services/llm.ts`
- [ ] T014 [US3] Implement Next.js API route in `src/app/api/generate/route.ts` using the prompt and the LLM service
- [ ] T015 [US3] Connect `GeneratorForm` submission to fetch from `/api/generate` and parse the raw string into HTML/Markdown
- [ ] T016 [US3] Add robust error handling UI in `src/app/page.tsx` for timeout or parsing failures

**Checkpoint**: All user stories are functionally complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T017 [P] Ensure mobile responsiveness (panels stack vertically on small screens) in `src/app/page.tsx`
- [ ] T018 Code cleanup and refactoring
- [ ] T019 Run quickstart validation to verify app launches successfully

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Stories (Phase 3+)**: Depend on Foundational.
  - US1 and US2 can theoretically run in parallel, but US2's layout relies on the main page structure.
  - US3 depends on US1 (Form) and US2 (Panels) to properly render its integrated output.

### Parallel Opportunities
- Dependency installations and configuration (T002, T003).
- Foundational Types and UI components (T005, T006).
- Panel components (T010, T011) can be built in parallel with the LLM service stub (T013).

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Complete Setup and Foundational.
2. Build Form & Loading (US1).
3. Build the Dual Panels (US2) using mock data.
4. **STOP and VALIDATE**: Verify UI visually without real API calls.
5. Integrate API logic (US3).
