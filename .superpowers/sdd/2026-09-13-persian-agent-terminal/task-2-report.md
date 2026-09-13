# Task 2 Report: Persian Letter Shaping Engine (`persianReshaper`)

## Summary of Implementation
Implemented the Persian letter shaping engine (`persianReshaper`) providing contextual Presentation Forms shaping (isolated, final, initial, medial) for Persian and Arabic text:
1. **Character Mapping Tables**:
   - Mapped all Arabic Presentation Forms-B and Presentation Forms-A glyphs with their contextual joining properties (non-joining, right-joining, dual-joining).
   - Full support for Persian-specific characters:
     - `پ` (Peh: isolated `\uFB56`, final `\uFB57`, initial `\uFB58`, medial `\uFB59`)
     - `چ` (Tcheh: isolated `\uFB7A`, final `\uFB7B`, initial `\uFB7C`, medial `\uFB7D`)
     - `ژ` (Zheh: isolated `\uFB8A`, final `\uFB8B`)
     - `ک` (Keheh / Persian Kaf: isolated `\uFB8E`, final `\uFB8F`, initial `\uFB90`, medial `\uFB91`)
     - `گ` (Gaf: isolated `\uFB92`, final `\uFB93`, initial `\uFB94`, medial `\uFB95`)
     - `ی` (Farsi Yeh: isolated `\uFBFC`, final `\uFBFD`, initial `\uFBFE`, medial `\uFBFF`)
     - `ۀ` (Heh with Yeh Above: isolated `\uFBA4`, final `\uFBA5`)
2. **Contextual Joining Engine**:
   - Forward and backward connection determination based on right-joining and dual-joining letter characteristics.
   - Lam-Alef ligatures (`لا`, `لأ`, `لإ`, `لآ`) mapped to their respective isolated (`\uFEFB`, `\uFEF7`, `\uFEF9`, `\uFEF5`) and final (`\uFEFC`, `\uFEF8`, `\uFEFA`, `\uFEF6`) ligature glyphs.
   - Transparent handling of Harakat / Tashkeel combining marks without breaking adjacent letter connections.
   - Accurate connection breaking with Zero-Width Non-Joiner (ZWNJ / نیم‌فاصله, `\u200C`) and connection forcing with Zero-Width Joiner (ZWJ, `\u200D`).
   - UTF-16 surrogate pair preservation and non-Persian character passthrough.
3. **Persian Character Identification**:
   - `isPersianChar(char: string): boolean` identifying Unicode points across Persian/Arabic script blocks (U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF, U+FB50-U+FDFF, U+FE70-U+FEFF, ZWNJ, ZWJ).
4. **TDD Unit Tests**:
   - Created test suite with 8 tests verifying `isPersianChar`, letter shaping into initial/medial/final/isolated presentation forms, Persian-specific letters, non-connecting letters, Lam-Alef ligatures, ZWNJ handling, and mixed text preservation.

---

## TDD Output

### 1. RED Output (Failing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/persianReshaper.spec.ts
```

Output:
```
file:///D:/Project/Tabby-New/tabby-persian/tabby-terminal/src/features/persian/persianReshaper.spec.ts:3
import { reshapePersian, isPersianChar } from './persianReshaper.ts'
                         ^^^^^^^^^^^^^
SyntaxError: The requested module './persianReshaper.ts' does not provide an export named 'isPersianChar'
    at ModuleJob._instantiate (node:internal/modules/esm/module_job:226:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:335:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:681:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)
```

### 2. GREEN Output (Passing Tests)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/persianReshaper.spec.ts
```

Output:
```
TAP version 13
# Subtest: isPersianChar identifies Persian/Arabic unicode points
ok 1 - isPersianChar identifies Persian/Arabic unicode points
  ---
  duration_ms: 0.7977
  type: 'test'
  ...
# Subtest: reshapePersian connects letters properly into presentation forms
ok 2 - reshapePersian connects letters properly into presentation forms
  ---
  duration_ms: 0.3323
  type: 'test'
  ...
# Subtest: reshapePersian handles Persian specific letters: پ, چ, ژ, گ
ok 3 - reshapePersian handles Persian specific letters: پ, چ, ژ, گ
  ---
  duration_ms: 0.1888
  type: 'test'
  ...
# Subtest: reshapePersian handles non-connecting letters
ok 4 - reshapePersian handles non-connecting letters
  ---
  duration_ms: 0.1606
  type: 'test'
  ...
# Subtest: reshapePersian handles Lam-Alef ligatures properly
ok 5 - reshapePersian handles Lam-Alef ligatures properly
  ---
  duration_ms: 0.1147
  type: 'test'
  ...
# Subtest: reshapePersian handles Persian specific letters: چ, گ, ک, ی in all positions
ok 6 - reshapePersian handles Persian specific letters: چ, گ, ک, ی in all positions
  ---
  duration_ms: 0.065
  type: 'test'
  ...
# Subtest: reshapePersian handles ZWNJ (Zero Width Non-Joiner / نیم‌فاصله)
ok 7 - reshapePersian handles ZWNJ (Zero Width Non-Joiner / نیم‌فاصله)
  ---
  duration_ms: 0.0515
  type: 'test'
  ...
# Subtest: reshapePersian preserves non-Persian characters and transparent marks
ok 8 - reshapePersian preserves non-Persian characters and transparent marks
  ---
  duration_ms: 0.5656
  type: 'test'
  ...
1..8
# tests 8
# suites 0
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 9.5778
```

---

## Files Created
- `tabby-terminal/src/features/persian/persianReshaper.ts`
- `tabby-terminal/src/features/persian/persianReshaper.spec.ts`

---

## Git Commit
- Commit: `64a32a08 feat(persian): implement contextual letter shaping engine`
- Branch: `feat/persian-agent-terminal`
