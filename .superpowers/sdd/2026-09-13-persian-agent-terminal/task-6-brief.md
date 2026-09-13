# Task 6 Brief: Session Middleware Integration (`PersianAgentMiddleware`)

## Task Description
Implement `PersianAgentMiddleware` in `tabby-terminal/src/middleware/persianAgentMiddleware.ts` and integrate it into `tabby-terminal/src/session.ts`.

`PersianAgentMiddleware` extends `SessionMiddleware` (from `tabby-terminal/src/api/middleware.ts`).
It connects:
1. `AgentMarkdownStyler` (from `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts`)
2. `processBidiLine` / `isRTL` (from `tabby-terminal/src/features/persian/persianBidi.ts`)

Options interface:
```typescript
export interface PersianAgentOptions {
    enablePersianBidi?: boolean
    enableAgentMarkdown?: boolean
}
```

Pipeline in `feedFromSession(data: Buffer)`:
- If neither option is enabled, forward data directly (`this.outputToTerminal.next(data)`).
- Incoming data is converted to string.
- First passed through `AgentMarkdownStyler` (if `enableAgentMarkdown` is true).
- Then passed line by line through `processBidiLine` (if `enablePersianBidi` is true).
- Forwarded as `Buffer.from(processedString)` to `this.outputToTerminal.next(...)`.

BaseSession in `tabby-terminal/src/session.ts`:
- Add method or hook in `BaseSession`:
  ```typescript
  setPersianAgentOptions(options: PersianAgentOptions): void
  ```
  Which attaches or updates `PersianAgentMiddleware` in `this.middleware` (the `SessionMiddlewareStack`).

## Requirements & TDD Steps
1. Create failing test `tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`:
   - Test `PersianAgentMiddleware` processes output stream with Markdown styling and BiDi reordering.
   - Test that when options are false/disabled, data passes through untouched.
   - Test `feedFromTerminal` forwards input to session unaltered.
   - Test `BaseSession.setPersianAgentOptions` attaches middleware correctly.
2. Run test to verify failure:
   `node --experimental-strip-types tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`
3. Implement `tabby-terminal/src/middleware/persianAgentMiddleware.ts` and update `tabby-terminal/src/session.ts`.
4. Run test to verify it passes.
5. Commit:
   `git add tabby-terminal/src/middleware/persianAgentMiddleware.ts tabby-terminal/src/session.ts tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`
   `git commit -m "feat(middleware): integrate PersianAgentMiddleware into session pipeline"`
6. Write report to `.superpowers/sdd/2026-09-13-persian-agent-terminal/task-6-report.md`.
