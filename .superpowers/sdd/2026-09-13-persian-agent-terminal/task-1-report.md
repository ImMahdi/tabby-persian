# Task 1 Report: Dual-Font Typography Setup (`YekanBakh` + Monospace)

## Summary of Implementation
Implemented dual-font typography configuration so Persian/Arabic characters render with `YekanBakh` while English characters and code remain monospaced:
1. **Font Assets**: Copied `YekanBakh-Regular.ttf` and `YekanBakh-Bold.ttf` from `d:/Project/Tabby-New/YekanBakh4 Pro/Font Family/ttf/` to `tabby-terminal/src/fonts/`.
2. **CSS Font-Face Rules**: Added `@font-face` definitions for `"YekanBakh"` to `tabby-terminal/src/frontends/xterm.css` for normal and bold weights specifying `unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;`.
3. **Font Fallback Chain**: Updated `getCSSFontFamily` in `tabby-core/src/utils.ts` to push `'YekanBakh'` prior to `'monospace-fallback'`.
4. **TDD Unit Test**: Created `tabby-terminal/src/features/persian/fontSetup.spec.ts` asserting that `getCSSFontFamily` includes the primary font, `"YekanBakh"`, and `"monospace-fallback"`.

---

## TDD Output

### 1. RED Output (Failing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/fontSetup.spec.ts
```

Output:
```
TAP version 13
# Subtest: getCSSFontFamily includes YekanBakh in fallback chain
not ok 1 - getCSSFontFamily includes YekanBakh in fallback chain
  ---
  duration_ms: 2.5429
  type: 'test'
  location: 'D:\\Project\\Tabby-New\\tabby-persian\\tabby-terminal\\src\\features\\persian\\fontSetup.spec.ts:5:1'
  failureType: 'testCodeFailure'
  error: 'Should contain YekanBakh fallback'
  code: 'ERR_ASSERTION'
  name: 'AssertionError'
  expected:
  actual: '"Source Code Pro", "monospace-fallback", "monospace"'
  operator: 'match'
  stack: |-
    TestContext.<anonymous> (file:///D:/Project/Tabby-New/tabby-persian/tabby-terminal/src/features/persian/fontSetup.spec.ts:14:12)
    Test.runInAsyncScope (node:async_hooks:214:14)
    Test.run (node:internal/test_runner/test:1047:25)
    Test.start (node:internal/test_runner/test:944:17)
    startSubtestAfterBootstrap (node:internal/test_runner/harness:296:17)
  ...
1..1
# tests 1
# suites 0
# pass 0
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7.348
```

### 2. GREEN Output (Passing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/fontSetup.spec.ts
```

Output:
```
TAP version 13
# Subtest: getCSSFontFamily includes YekanBakh in fallback chain
ok 1 - getCSSFontFamily includes YekanBakh in fallback chain
  ---
  duration_ms: 2.6086
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7.2409
```

---

## Files Changed and Created
- `tabby-terminal/src/fonts/YekanBakh-Regular.ttf` (New font file)
- `tabby-terminal/src/fonts/YekanBakh-Bold.ttf` (New font file)
- `tabby-terminal/src/frontends/xterm.css` (Added @font-face rules with unicode-range)
- `tabby-core/src/utils.ts` (Added 'YekanBakh' to font list)
- `tabby-terminal/src/features/persian/fontSetup.spec.ts` (New unit test)

---

## Git Commit
Commit: `b3c2ea94 feat(typography): add Yekan Bakh font with unicode-range fallback`
Branch: `feat/persian-agent-terminal`
