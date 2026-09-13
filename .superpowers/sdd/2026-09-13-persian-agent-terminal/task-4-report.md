# Task 4 Report: Persian BiDi Visual Reordering Engine (`persianBidi`)

## Summary of Implementation
Implemented the Bidirectional (BiDi) visual reordering engine in `tabby-terminal/src/features/persian/persianBidi.ts` to transform terminal stream lines for xterm.js Left-to-Right (LTR) cell grid rendering:
1. **RTL Character Detection (`isRTL`)**:
   - Accurately checks for the presence of Arabic, Persian (`\u0600-\u06FF`, `\u0750-\u077F`, `\u08A0-\u08FF`, `\uFB50-\uFDFF`, `\uFE70-\uFEFF`), and Hebrew characters.
   - Serves as an instant fast-path bypass in `processBidiLine` for purely Latin/English terminal output (e.g. standard build logs, CLI commands) with zero reordering overhead.
2. **Contextual Reshaping & Visual Reversal (`reshapePersianAndReverse`)**:
   - Integrates `reshapePersian` from `persianReshaper.ts` to convert base Persian characters into contextual Presentation Forms glyphs (isolated, initial, medial, final) and Lam-Alef ligatures in logical order.
   - Performs code-point-aware string reversal so that characters are positioned from right to left across terminal grid columns.
   - Applies symmetric bracket and parenthesis mirroring (`(`, `)`, `[`, `]`, `{`, `}`, `<`, `>`, `«`, `»`) within RTL contexts.
3. **Mixed Text & CLI Command Preservation**:
   - Tokenizes text into typed spans (`rtl`, `ltr`, `num`, `sep`).
   - English CLI commands, arguments, paths, and URLs (e.g. `npm run build`, `git commit`, `--short`, `/var/log`) remain strictly in natural Left-to-Right order.
   - Numbers and digit sequences (e.g. `8080`, `127.0.0.1:8080`, `2026-09-13`) remain in natural Left-to-Right order.
   - Implements intelligent span collapsing across whitespace for compatible adjacent spans without ANSI boundaries.
4. **ANSI Escape Sequence Preservation & Formatting Attachment**:
   - Tokenizes lines via `tokenizeAnsi` from `ansiPreserver.ts`.
   - Associates SGR style prefixes (e.g. `\x1b[32m`, `\x1b[1;36m`) and suffix resets (e.g. `\x1b[0m`) directly with their target text spans.
   - Formatting codes travel with their styled words during BiDi reordering, ensuring colors and styles wrap the exact words intended without sequence inversion or corruption.
5. **Bidirectional Base Direction Resolution**:
   - Implements Unicode Bidirectional Algorithm (UBA) Rule P2 for base line direction detection.
   - For RTL base lines, visually reorders spans from right to left while keeping LTR spans and numbers internally LTR.
   - For LTR base lines (e.g. `[INFO] پورت 8080 فعال شد`), keeps LTR prefixes on the left while correctly reordering embedded RTL spans.
6. **Multiline Stream Support (`processBidiText`)**:
   - Splits multiline chunks while preserving line terminator delimiters (`\r\n` and `\n`), processing each line independently and reassembling the stream.

---

## TDD Output

### 1. RED Output (Failing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/persianBidi.spec.ts
```

Output:
```
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\Project\Tabby-New\tabby-persian\tabby-terminal\src\features\persian\persianBidi' imported from D:\Project\Tabby-New\tabby-persian\tabby-terminal\src\features\persian\persianBidi.spec.ts
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    at moduleResolve (node:internal/modules/esm/resolve:861:10)
    at defaultResolve (node:internal/modules/esm/resolve:985:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:747:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:724:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:320:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:182:49) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///D:/Project/Tabby-New/tabby-persian/tabby-terminal/src/features/persian/persianBidi'
}

Node.js v22.22.3
```

### 2. GREEN Output (Passing Tests)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/persianBidi.spec.ts
```

Output:
```
TAP version 13
# Subtest: isRTL detects presence of Persian characters
ok 1 - isRTL detects presence of Persian characters
  ---
  duration_ms: 1.2013
  type: 'test'
  ...
# Subtest: processBidiLine on pure Persian text reshapes and visually reverses for LTR cell grid
ok 2 - processBidiLine on pure Persian text reshapes and visually reverses for LTR cell grid
  ---
  duration_ms: 0.5995
  type: 'test'
  ...
# Subtest: processBidiLine preserves English commands in mixed lines
ok 3 - processBidiLine preserves English commands in mixed lines
  ---
  duration_ms: 0.4023
  type: 'test'
  ...
# Subtest: processBidiLine preserves numbers in natural LTR order
ok 4 - processBidiLine preserves numbers in natural LTR order
  ---
  duration_ms: 0.1475
  type: 'test'
  ...
# Subtest: processBidiLine preserves ANSI color sequences around Persian words
ok 5 - processBidiLine preserves ANSI color sequences around Persian words
  ---
  duration_ms: 0.1914
  type: 'test'
  ...
# Subtest: processBidiText processes multiline text
ok 6 - processBidiText processes multiline text
  ---
  duration_ms: 0.1482
  type: 'test'
  ...
# Subtest: processBidiLine returns unmodified text when no RTL characters are present
ok 7 - processBidiLine returns unmodified text when no RTL characters are present
  ---
  duration_ms: 0.1009
  type: 'test'
  ...
# Subtest: processBidiLine preserves LTR prefix in mixed lines
ok 8 - processBidiLine preserves LTR prefix in mixed lines
  ---
  duration_ms: 0.3493
  type: 'test'
  ...
# Subtest: processBidiLine handles empty or falsy input
ok 9 - processBidiLine handles empty or falsy input
  ---
  duration_ms: 0.2279
  type: 'test'
  ...
# Subtest: processBidiText preserves CRLF line endings
ok 10 - processBidiText preserves CRLF line endings
  ---
  duration_ms: 0.2991
  type: 'test'
  ...
# Subtest: processBidiLine preserves brackets with mirroring in Persian context
ok 11 - processBidiLine preserves brackets with mirroring in Persian context
  ---
  duration_ms: 0.155
  type: 'test'
  ...
1..11
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 12.0308
```

---

## Files Created / Modified
- `tabby-terminal/src/features/persian/persianBidi.ts`
- `tabby-terminal/src/features/persian/persianBidi.spec.ts`

---

## Git Commit
- Commit: `e13a9473 feat(persian): implement BiDi visual reordering with mixed-text preservation`
- Branch: `feat/persian-agent-terminal`
