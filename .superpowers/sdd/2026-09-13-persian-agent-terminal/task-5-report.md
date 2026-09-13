# Task 5 Report: Agent Markdown Stream Styler (`agentMarkdownStyler`)

## Summary of Implementation
Implemented the streaming Markdown styler in `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts` to convert streaming Markdown output from AI CLI agents (Claude Code, agy, codex, opencode) into terminal-optimized ANSI sequences with Unicode Box-Drawing codeblock borders and comprehensive safety guards:

1. **Alternate Screen Buffer Guard (`handleTerminalSequence`, `isAlternateScreen`)**:
   - Detects standard terminal alternate screen buffer escape sequences (`\x1b[?1049h` / `\x1b[?1049l`, `\x1b[?1047h` / `\x1b[?1047l`, `\x1b[?47h` / `\x1b[?47l`).
   - When in alternate screen mode (such as when running full-screen interactive curses/TUI applications: `vim`, `nano`, `htop`, `less`), all Markdown processing is strictly bypassed and raw terminal sequences and lines pass through unmodified.
   - Any buffered incomplete lines are instantly flushed untouched upon switching to alternate screen mode.

2. **Unicode Box-Drawing Fenced Code Blocks**:
   - Opening fence ```` ```[lang] ```` creates a 51-column Box-Drawing header with language badge:
     `\x1b[38;5;244m┌─ [\x1b[38;5;220m[lang]\x1b[38;5;244m] ──────────────────────────────────┐\x1b[0m`
   - Opening fence without language ```` ``` ```` produces a continuous top border:
     `\x1b[38;5;244m┌─────────────────────────────────────────────────┐\x1b[0m`
   - Code block body lines are framed with the vertical border `\x1b[38;5;244m│ \x1b[0m[content]` while raw code content is preserved without markdown styling corruption.
   - Closing fence ```` ``` ```` terminates with bottom Box-Drawing border:
     `\x1b[38;5;244m└─────────────────────────────────────────────────┘\x1b[0m`.

3. **Styled Markdown Headings**:
   - `# Heading 1` -> Bold cyan diamond glyph `\x1b[1;36m◆ Heading 1\x1b[0m`
   - `## Heading 2` -> Bold magenta arrow glyph `\x1b[1;35m▸ Heading 2\x1b[0m`
   - `### Heading 3` -> Bold yellow circle glyph `\x1b[1;33m● Heading 3\x1b[0m`
   - `####+ Heading 4` -> Bold blue open circle glyph `\x1b[1;34m○ Heading 4\x1b[0m`

4. **Blockquotes & Horizontal Rules**:
   - Blockquote lines `> quote` format with cyan vertical bar indicator `\x1b[38;5;39m│\x1b[0m` and italicized content `\x1b[3mquote\x1b[23m`.
   - Horizontal rules (`---`, `***`, `___`) render as 50-character subtle gray divider lines `\x1b[38;5;240m─...─\x1b[0m`.

5. **Bullet Lists**:
   - List items starting with `- item` or `* item` convert to styled bullet dots `  \x1b[38;5;245m•\x1b[0m item` while maintaining indentation levels.

6. **Inline Formatting Protection**:
   - Protects inline code blocks (`` `code` ``) with placeholder extraction so embedded asterisks (e.g. `` `*ptr` ``) avoid false italic/bold triggers.
   - Styled inline code: `\x1b[48;5;236m\x1b[38;5;223m code \x1b[0m`.
   - Styled bold: `\x1b[1mbold\x1b[22m`.
   - Styled italic: `\x1b[3mitalic\x1b[23m`.
   - Styled bold-italic: `\x1b[1;3mbold-italic\x1b[22;23m`.

7. **Chunked Stream & Line Buffering (`processChunk`, `flush`, `reset`)**:
   - Buffers partial streaming chunks until complete line breaks (`\r\n` or `\n`), preserving line ending formats.
   - Splits incoming chunks along alternate screen transition sequences to guarantee seamless switching between normal and alternate screens mid-stream.
   - `flush()` processes any un-terminated tail lines, and `reset()` cleanly clears buffers and state machine flags.

---

## TDD Output

### 1. RED Output (Failing Test)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts
```

Output:
```
node:internal/modules/esm/resolve:275
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\Project\Tabby-New\tabby-persian\tabby-terminal\src\features\markdown\agentMarkdownStyler' imported from D:\Project\Tabby-New\tabby-persian\tabby-terminal\src\features\markdown\agentMarkdownStyler.spec.ts
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    at moduleResolve (node:internal/modules/esm/resolve:861:10)
    at defaultResolve (node:internal/modules/esm/resolve:985:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:747:20)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:724:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:320:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:182:49) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///D:/Project/Tabby-New/tabby-persian/tabby-terminal/src/features/markdown/agentMarkdownStyler'
}

Node.js v22.22.3
```

### 2. GREEN Output (Passing Tests)
Command:
```bash
node --experimental-strip-types tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts
```

Output:
```
TAP version 13
# Subtest: AgentMarkdownStyler styles Markdown headings with bold and glyphs
ok 1 - AgentMarkdownStyler styles Markdown headings with bold and glyphs
  ---
  duration_ms: 0.898
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler transforms fenced code blocks into Box-Drawing borders
ok 2 - AgentMarkdownStyler transforms fenced code blocks into Box-Drawing borders
  ---
  duration_ms: 0.2255
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler formats inline code and bold
ok 3 - AgentMarkdownStyler formats inline code and bold
  ---
  duration_ms: 0.2584
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler bypasses processing in alternate screen buffer mode
ok 4 - AgentMarkdownStyler bypasses processing in alternate screen buffer mode
  ---
  duration_ms: 0.1417
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler processes streaming chunks across lines
ok 5 - AgentMarkdownStyler processes streaming chunks across lines
  ---
  duration_ms: 0.2597
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler formats H2 and H3 headings
ok 6 - AgentMarkdownStyler formats H2 and H3 headings
  ---
  duration_ms: 0.0738
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler formats blockquotes and horizontal rules
ok 7 - AgentMarkdownStyler formats blockquotes and horizontal rules
  ---
  duration_ms: 0.5769
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler formats bullet list items
ok 8 - AgentMarkdownStyler formats bullet list items
  ---
  duration_ms: 0.1746
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler supports alternate screen switching via xterm 47 codes
ok 9 - AgentMarkdownStyler supports alternate screen switching via xterm 47 codes
  ---
  duration_ms: 0.1735
  type: 'test'
  ...
# Subtest: AgentMarkdownStyler buffers incomplete streaming lines
ok 10 - AgentMarkdownStyler buffers incomplete streaming lines
  ---
  duration_ms: 0.2567
  type: 'test'
  ...
1..10
# tests 10
# suites 0
# pass 10
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 9.7101
```

---

## Files Created / Modified
- `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts`
- `tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`

---

## Git Commit
- Commit: `8433bd15 feat(markdown): implement streaming Markdown styler with box drawing and alt-screen guard`
- Branch: `feat/persian-agent-terminal`
