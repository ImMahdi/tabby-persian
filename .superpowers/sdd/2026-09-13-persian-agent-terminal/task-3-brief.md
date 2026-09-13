# Task 3 Brief: ANSI Sequence Preserver & Tokenizer (`ansiPreserver`)

## Task Description
Implement the ANSI escape sequence preserver in `tabby-terminal/src/features/persian/ansiPreserver.ts`.
In a terminal, streams contain ANSI escape sequences:
- SGR Colors & formatting: `\x1b[32m`, `\x1b[1;31m`, `\x1b[38;5;220m`, `\x1b[38;2;255;100;50m`, `\x1b[0m`
- Cursor control: `\x1b[2K`, `\x1b[1A`, `\r`, `\n`
- Private modes: `\x1b[?1049h`, `\x1b[?25h`
- OSC sequences: `\x1b]0;Title\x07`, `\x1b]8;;url\x1b\`

The preserver must:
1. Parse an input string into an ordered array of tokens:
   - `{ type: 'ansi', value: string }`
   - `{ type: 'text', value: string }`
2. Provide a higher-order function:
   `processWithAnsi(input: string, textProcessor: (text: string) => string): string`
   Which applies `textProcessor` exclusively to text tokens while leaving ANSI tokens exactly in their original positions and order.
3. Provide helper:
   `hasAnsi(text: string): boolean`
   `stripAnsi(text: string): string`

Exported interfaces & functions:
```typescript
export interface AnsiToken {
    type: 'ansi' | 'text'
    value: string
}

export function tokenizeAnsi(input: string): AnsiToken[]
export function processWithAnsi(input: string, textProcessor: (text: string) => string): string
export function stripAnsi(input: string): string
export function hasAnsi(input: string): boolean
```

## Requirements & TDD Steps
1. Create failing test `tabby-terminal/src/features/persian/ansiPreserver.spec.ts`:
   - Test `tokenizeAnsi` separates escape sequences from text content.
   - Test `processWithAnsi` transforms text while keeping ANSI intact.
   - Test 24-bit RGB and 256-color ANSI escape sequences.
   - Test `stripAnsi` and `hasAnsi`.
2. Run test to verify failure:
   `node --experimental-strip-types tabby-terminal/src/features/persian/ansiPreserver.spec.ts`
3. Implement `tabby-terminal/src/features/persian/ansiPreserver.ts`.
4. Run test to verify it passes.
5. Commit:
   `git add tabby-terminal/src/features/persian/ansiPreserver.ts tabby-terminal/src/features/persian/ansiPreserver.spec.ts`
   `git commit -m "feat(persian): implement ANSI escape sequence tokenizer and preserver"`
6. Write report to `.superpowers/sdd/2026-09-13-persian-agent-terminal/task-3-report.md`.
