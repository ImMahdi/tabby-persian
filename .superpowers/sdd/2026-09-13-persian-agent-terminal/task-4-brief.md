# Task 4 Brief: Persian BiDi Visual Reordering Engine (`persianBidi`)

## Task Description
Implement the bidirectional visual reordering engine in `tabby-terminal/src/features/persian/persianBidi.ts`.

In terminal emulators (xterm.js), the cell grid renders left-to-right (LTR). When Persian text is received, it needs:
1. Reshaping (joining characters into Presentation Forms via `reshapePersian` from `persianReshaper.ts`).
2. Visual reordering so that Persian runs appear in right-to-left reading order when rendered by an LTR grid.
3. Mixed text preservation:
   - English words, CLI commands, file paths, URLs (e.g. `npm run build`, `git status`, `http://...`) MUST remain in Left-to-Right order.
   - Numbers (e.g. `8080`, `123`) MUST remain in natural Left-to-Right order (e.g. `8080` not `0808`).
   - Brackets, parentheses, punctuation adjacent to Persian text must be handled naturally.
4. ANSI escape sequence preservation:
   - Uses `processWithAnsi` or ANSI tokenization from `ansiPreserver.ts` to ensure escape sequences remain attached to the correct text elements without being reversed or corrupted.

Exported functions:
```typescript
export function processBidiLine(line: string): string
export function processBidiText(text: string): string
export function isRTL(text: string): boolean
```

## Requirements & TDD Steps
1. Create failing test `tabby-terminal/src/features/persian/persianBidi.spec.ts`:
   - Test `processBidiLine` on pure Persian string (reverses visual order of reshaped glyphs).
   - Test `processBidiLine` on mixed Persian + English command (`دستور npm run build اجرا شد` -> `npm run build` stays LTR).
   - Test `processBidiLine` on Persian + numbers (`پورت 8080 فعال است` -> `8080` stays LTR).
   - Test with ANSI colors (`\x1b[32mسلام\x1b[0m دنیا` -> colors wrap around the correct reshaped words).
   - Test multiline `processBidiText`.
2. Run test to verify failure:
   `node --experimental-strip-types tabby-terminal/src/features/persian/persianBidi.spec.ts`
3. Implement `tabby-terminal/src/features/persian/persianBidi.ts`.
4. Run test to verify it passes.
5. Commit:
   `git add tabby-terminal/src/features/persian/persianBidi.ts tabby-terminal/src/features/persian/persianBidi.spec.ts`
   `git commit -m "feat(persian): implement BiDi visual reordering with mixed-text preservation"`
6. Write report to `.superpowers/sdd/2026-09-13-persian-agent-terminal/task-4-report.md`.
