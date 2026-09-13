# Task 5 Brief: Agent Markdown Stream Styler (`agentMarkdownStyler`)

## Task Description
Implement the streaming Markdown styler for AI agent terminal output in `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts`.

When modern CLI agents (Claude Code, agy, codex, opencode) stream output:
- Headings:
  - `# Heading 1` -> `\x1b[1;36m◆ Heading 1\x1b[0m`
  - `## Heading 2` -> `\x1b[1;35m▸ Heading 2\x1b[0m`
  - `### Heading 3` -> `\x1b[1;33m● Heading 3\x1b[0m`
- Code blocks:
  - Opening ```` ```[lang] ```` -> `\x1b[38;5;244m┌─ [\x1b[38;5;220m[lang]\x1b[38;5;244m] ──────────────────────────────────┐\x1b[0m`
  - Body lines -> `\x1b[38;5;244m│ \x1b[0m[content]`
  - Closing ```` ``` ```` -> `\x1b[38;5;244m└─────────────────────────────────────────────────┘\x1b[0m`
- Inline elements:
  - `**bold**` -> `\x1b[1mbold\x1b[22m`
  - `*italic*` -> `\x1b[3mitalic\x1b[23m`
  - `` `code` `` -> `\x1b[48;5;236m\x1b[38;5;223m code \x1b[0m`
- Blockquotes:
  - `> quote` -> `\x1b[38;5;39m│\x1b[0m \x1b[3mquote\x1b[23m`
- Horizontal rules:
  - `---` or `***` -> `\x1b[38;5;240m──────────────────────────────────────────────────\x1b[0m`
- Bullet lists:
  - `- item` or `* item` -> `  \x1b[38;5;245m•\x1b[0m item`

Crucial Safety Guards:
- Alternate Screen Buffer Guard:
  - Detects `\x1b[?1049h` (enter alternate screen) and `\x1b[?1049l` (exit alternate screen).
  - When in alternate screen (e.g. `vim`, `nano`, `htop`, curses TUI), all Markdown processing MUST be bypassed, passing raw data through unchanged!
- Tracking method:
  `handleTerminalSequence(data: string): void`
  `isAlternateScreen(): boolean`
  `processLine(line: string): string`
  `processChunk(chunk: string): string`

Exported Class:
```typescript
export class AgentMarkdownStyler {
    isAlternateScreen(): boolean
    handleTerminalSequence(data: string): void
    processLine(line: string): string
    processChunk(chunk: string): string
    reset(): void
}
```

## Requirements & TDD Steps
1. Create failing test `tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`:
   - Test headings transformation.
   - Test code blocks with Box-Drawing opening, line prefixing, and closing.
   - Test inline formatting (`**bold**`, `` `code` ``).
   - Test blockquotes and horizontal rules.
   - Test alternate screen bypass (`\x1b[?1049h` -> line untouched, `\x1b[?1049l` -> processing resumes).
   - Test streaming `processChunk` across lines.
2. Run test to verify failure:
   `node --experimental-strip-types tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`
3. Implement `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts`.
4. Run test to verify it passes.
5. Commit:
   `git add tabby-terminal/src/features/markdown/agentMarkdownStyler.ts tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`
   `git commit -m "feat(markdown): implement streaming Markdown styler with box drawing and alt-screen guard"`
6. Write report to `.superpowers/sdd/2026-09-13-persian-agent-terminal/task-5-report.md`.
