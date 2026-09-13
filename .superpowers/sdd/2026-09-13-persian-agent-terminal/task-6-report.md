# Task 6 Report: Session Middleware Integration (`PersianAgentMiddleware`)

## Summary of Implementation
Implemented `PersianAgentMiddleware` in `tabby-terminal/src/middleware/persianAgentMiddleware.ts` and integrated it into `BaseSession` in `tabby-terminal/src/session.ts`:

1. **Session Pipeline Middleware (`PersianAgentMiddleware`)**:
   - Extends `SessionMiddleware` from `tabby-terminal/src/api/middleware.ts`.
   - Manages configurable options via `PersianAgentOptions` (`enablePersianBidi` and `enableAgentMarkdown`).
   - Integrates `AgentMarkdownStyler` for formatting AI agent Markdown output stream into ANSI Box-Drawing code blocks, headings, blockquotes, lists, and inline styles with alternate screen buffer detection.
   - Integrates `processBidiText` / `processBidiLine` for bidirectional reordering, contextual Persian letter reshaping, and mixed English/command/number preservation.
   - Direct pass-through fast path when both features are disabled (`!enablePersianBidi && !enableAgentMarkdown`), guaranteeing zero latency/overhead for standard terminal sessions.
   - Terminal input pass-through via `feedFromTerminal` to `outputToSession.next(...)`, ensuring commands entered by users flow to the session untouched.
   - Buffer flushing on `close()` to flush any un-terminated lines in the markdown styler before completing streams.

2. **Session Integration (`BaseSession`)**:
   - Added `persianAgentProcessor: PersianAgentMiddleware | null = null` to `BaseSession`.
   - Added `setPersianAgentOptions(options: PersianAgentOptions): void` method that pushes or dynamically replaces the middleware within `this.middleware` (`SessionMiddlewareStack`), mirroring `setLoginScriptsOptions`.
   - Exported `PersianAgentMiddleware` and `PersianAgentOptions` from `tabby-terminal/src/session.ts`.

---

## TDD Output

### 1. RED Output (Failing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts
```

Output:
```
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\Project\Tabby-New\tabby-persian\tabby-terminal\src\middleware\persianAgentMiddleware.ts' imported from D:\Project\Tabby-New\tabby-persian\tabby-terminal\src\middleware\persianAgentMiddleware.spec.ts
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    at moduleResolve (node:internal/modules/esm/resolve:861:10)
    at defaultResolve (node:internal/modules/esm/resolve:985:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:747:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:724:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:320:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:182:49) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///D:/Project/Tabby-New/tabby-persian/tabby-terminal/src/middleware/persianAgentMiddleware.ts'
}

Node.js v22.22.3
```

### 2. GREEN Output (Passing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts
```

Output:
```
TAP version 13
# Subtest: PersianAgentMiddleware processes output stream with Markdown and BiDi
ok 1 - PersianAgentMiddleware processes output stream with Markdown and BiDi
  ---
  duration_ms: 1.6794
  type: 'test'
  ...
# Subtest: PersianAgentMiddleware passes data directly when features are disabled
ok 2 - PersianAgentMiddleware passes data directly when features are disabled
  ---
  duration_ms: 0.1393
  type: 'test'
  ...
# Subtest: PersianAgentMiddleware forwards terminal input directly to session unaltered
ok 3 - PersianAgentMiddleware forwards terminal input directly to session unaltered
  ---
  duration_ms: 0.1421
  type: 'test'
  ...
# Subtest: PersianAgentMiddleware handles Persian BiDi alone when Markdown is disabled
ok 4 - PersianAgentMiddleware handles Persian BiDi alone when Markdown is disabled
  ---
  duration_ms: 0.2588
  type: 'test'
  ...
# Subtest: PersianAgentMiddleware handles Markdown alone when BiDi is disabled
ok 5 - PersianAgentMiddleware handles Markdown alone when BiDi is disabled
  ---
  duration_ms: 0.3108
  type: 'test'
  ...
# Subtest: PersianAgentMiddleware flushes un-terminated buffer on close
ok 6 - PersianAgentMiddleware flushes un-terminated buffer on close
  ---
  duration_ms: 0.5518
  type: 'test'
  ...
# Subtest: SessionMiddlewareStack integrates PersianAgentMiddleware dynamically
ok 7 - SessionMiddlewareStack integrates PersianAgentMiddleware dynamically
  ---
  duration_ms: 0.5213
  type: 'test'
  ...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 9.7799
```

---

## Test Suite Summary
All unit tests in `tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts` pass cleanly (7/7):
1. **Full Pipeline Processing**: Verifies that streaming Persian Markdown `# گزارش سیستم\n` is styled with Markdown glyph `◆` and reshaped/reordered for RTL visual grid rendering.
2. **Direct Pass-through when Disabled**: Verifies that when `enablePersianBidi: false` and `enableAgentMarkdown: false`, raw text passes through untouched without string transformations.
3. **Terminal Input Pass-through**: Verifies that user keyboard input into `feedFromTerminal` is directly emitted to `outputToSession$` without alteration.
4. **BiDi Only Mode**: Verifies that Persian text is reshaped and reordered while Markdown styling remains disabled.
5. **Markdown Only Mode**: Verifies that Markdown headings and formatting are applied while BiDi reordering is disabled.
6. **Flush on Close**: Verifies that buffered partial lines without newline are properly styled and flushed upon middleware closure.
7. **Dynamic Middleware Stack Integration**: Verifies that `SessionMiddlewareStack` can push and dynamically replace `PersianAgentMiddleware` while session remains active.

Additionally, all existing tests in the suite continue to pass:
- `tabby-terminal/src/features/persian/fontSetup.spec.ts` (1/1 passing)
- `tabby-terminal/src/features/persian/ansiPreserver.spec.ts` (9/9 passing)
- `tabby-terminal/src/features/persian/persianReshaper.spec.ts` (8/8 passing)
- `tabby-terminal/src/features/persian/persianBidi.spec.ts` (11/11 passing)
- `tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts` (10/10 passing)
- Total: 46/46 passing across the feature suite.

---

## Commits
- `6ba11cec` feat(middleware): integrate PersianAgentMiddleware into session pipeline
