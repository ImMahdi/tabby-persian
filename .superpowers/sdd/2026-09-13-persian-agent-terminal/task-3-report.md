# Task 3 Report: ANSI Sequence Preserver & Tokenizer (`ansiPreserver`)

## Summary of Implementation
Implemented the ANSI escape sequence preserver and tokenizer in `tabby-terminal/src/features/persian/ansiPreserver.ts` to ensure terminal formatting codes (SGR colors, cursor movements, OSC titles/links, private modes) remain uncorrupted during downstream text transformations (e.g. Persian reshaping and BiDi reordering):
1. **ANSI Escape Sequence Pattern**:
   - Comprehensive regex matching all standard terminal escape sequences:
     - CSI (Control Sequence Introducer): `\x1b\[` or `\u009b` followed by parameter bytes (`[0-9:;<=>?]`), intermediate bytes (`[\x20-\x2F]`), and final commands (`[@-~]`). Handles standard color codes (`\x1b[32m`), styles (`\x1b[1;31m`), 256-color (`\x1b[38;5;208m`), 24-bit truecolor RGB (`\x1b[38;2;255;100;50m`), cursor moves (`\x1b[2K`, `\x1b[1A`), and private mode flags (`\x1b[?1049h`, `\x1b[?25h`).
     - OSC (Operating System Command): `\x1b\]` or `\u009d` terminated by BEL (`\x07`) or ST (`\x1b\\` or `\u009c`), e.g., window titles and OSC 8 hyperlinks.
     - DCS / APC / PM / SOS: device control strings and privacy messages.
     - Character set designations: `\x1b[()#%*+][@-~]`.
     - 2-byte escape sequences: `\x1b[@-Z\\-_0-9=><~]` (e.g. keypad modes, cursor save/restore).
2. **Tokenization Engine (`tokenizeAnsi`)**:
   - Deconstructs an input string into an ordered array of `AnsiToken` elements (`{ type: 'ansi' | 'text', value: string }`).
   - Accurately preserves adjacent escape codes, text chunks, mixed content, and empty input.
3. **Higher-Order Preserving Processor (`processWithAnsi`)**:
   - Applies any text transformation callback (`(text: string) => string`) exclusively to text tokens.
   - ANSI escape tokens remain in their exact original positions and order without interference or corruption.
4. **ANSI Detection and Stripping Utilities**:
   - `hasAnsi(input: string): boolean`: detects the presence of any ANSI sequence.
   - `stripAnsi(input: string): string`: extracts pure plain text by removing all escape sequences.
5. **TDD Unit Tests (`ansiPreserver.spec.ts`)**:
   - 9 unit tests verifying tokenization of standard/256-color/24-bit RGB codes, OSC and cursor control sequences, consecutive ANSI sequences, plain text processing, empty string handling, and ANSI detection/stripping.

---

## TDD Output

### 1. RED Output (Failing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/ansiPreserver.spec.ts
```

Output:
```
# Subtest: tokenizeAnsi separates escape sequences from text content
not ok 1 - tokenizeAnsi separates escape sequences from text content
# Subtest: processWithAnsi transforms text while keeping ANSI intact
not ok 2 - processWithAnsi transforms text while keeping ANSI intact
# Subtest: tokenizeAnsi handles complex 256-color and 24-bit RGB codes
not ok 3 - tokenizeAnsi handles complex 256-color and 24-bit RGB codes
# Subtest: stripAnsi removes all escape codes
not ok 4 - stripAnsi removes all escape codes
# Subtest: hasAnsi detects presence of escape codes
not ok 5 - hasAnsi detects presence of escape codes
# Subtest: tokenizeAnsi handles OSC sequences and cursor control codes
not ok 6 - tokenizeAnsi handles OSC sequences and cursor control codes
# Subtest: tokenizeAnsi handles consecutive ANSI codes without text between them
not ok 7 - tokenizeAnsi handles consecutive ANSI codes without text between them
# Subtest: processWithAnsi handles string with no ANSI codes
not ok 8 - processWithAnsi handles string with no ANSI codes
# Subtest: processWithAnsi handles empty string
not ok 9 - processWithAnsi handles empty string
1..9
# tests 9
# suites 0
# pass 0
# fail 9
# cancelled 0
# skipped 0
# todo 0
# duration_ms 11.4764
```

### 2. GREEN Output (Passing Tests)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/persian/ansiPreserver.spec.ts
```

Output:
```
TAP version 13
# Subtest: tokenizeAnsi separates escape sequences from text content
ok 1 - tokenizeAnsi separates escape sequences from text content
  ---
  duration_ms: 1.128
  type: 'test'
  ...
# Subtest: processWithAnsi transforms text while keeping ANSI intact
ok 2 - processWithAnsi transforms text while keeping ANSI intact
  ---
  duration_ms: 0.1247
  type: 'test'
  ...
# Subtest: tokenizeAnsi handles complex 256-color and 24-bit RGB codes
ok 3 - tokenizeAnsi handles complex 256-color and 24-bit RGB codes
  ---
  duration_ms: 0.0793
  type: 'test'
  ...
# Subtest: stripAnsi removes all escape codes
ok 4 - stripAnsi removes all escape codes
  ---
  duration_ms: 0.0768
  type: 'test'
  ...
# Subtest: hasAnsi detects presence of escape codes
ok 5 - hasAnsi detects presence of escape codes
  ---
  duration_ms: 0.0765
  type: 'test'
  ...
# Subtest: tokenizeAnsi handles OSC sequences and cursor control codes
ok 6 - tokenizeAnsi handles OSC sequences and cursor control codes
  ---
  duration_ms: 0.1566
  type: 'test'
  ...
# Subtest: tokenizeAnsi handles consecutive ANSI codes without text between them
ok 7 - tokenizeAnsi handles consecutive ANSI codes without text between them
  ---
  duration_ms: 0.1524
  type: 'test'
  ...
# Subtest: processWithAnsi handles string with no ANSI codes
ok 8 - processWithAnsi handles string with no ANSI codes
  ---
  duration_ms: 0.066
  type: 'test'
  ...
# Subtest: processWithAnsi handles empty string
ok 9 - processWithAnsi handles empty string
  ---
  duration_ms: 0.1735
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8.7528
```

---

## Files Created
- `tabby-terminal/src/features/persian/ansiPreserver.ts`
- `tabby-terminal/src/features/persian/ansiPreserver.spec.ts`

---

## Git Commit
- Commit: `40de53e5 feat(persian): implement ANSI escape sequence tokenizer and preserver`
- Branch: `feat/persian-agent-terminal`
