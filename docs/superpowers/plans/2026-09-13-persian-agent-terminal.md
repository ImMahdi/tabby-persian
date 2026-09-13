# Persian & CLI Agent Terminal Preset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a specialized, built-in "Persian & Agent Terminal" preset in Tabby with BiDi text shaping, Yekan Bakh typography, and streaming Markdown styling for AI agent CLI outputs.

**Architecture:** Implement a modular `PersianAgentMiddleware` inside Tabby's `SessionMiddlewareStack` that intercepts the terminal stream. The middleware pipeline first passes text through an `AgentMarkdownStyler` (transforming markdown into ANSI sequences and Box-Drawing borders while respecting alternate screen buffers), then through a `PersianBidi` engine (which isolates ANSI escape sequences, contextually shapes Persian letters via Unicode Presentation Forms, and reorders mixed LTR/RTL text for visual accuracy). In parallel, Yekan Bakh fonts are integrated via CSS `unicode-range` so Persian renders with Yekan Bakh while English commands and numbers retain monospaced styling.

**Tech Stack:** TypeScript, Angular, Electron, `@xterm/xterm`, Node.js native test runner (`node:test`, `node:assert`), CSS `@font-face` with `unicode-range`.

**Spec:** [`tabby-persian/docs/superpowers/specs/2026-09-13-persian-agent-shell-design.md`](file:///d:/Project/Tabby-New/tabby-persian/docs/superpowers/specs/2026-09-13-persian-agent-shell-design.md)

## Global Constraints
- Do not modify or break existing standard terminal presets (`PowerShell`, `CMD`, `WSL`, `Default`); they must remain completely unaffected.
- Keep English code, shell commands, ASCII art, and numbers strictly LTR and styled with monospaced font metrics.
- Never corrupt or reverse ANSI escape sequences (colors, cursor movements, OSC hyper-links).
- Alternate screen buffer programs (`nano`, `vim`, `htop`) must bypass Markdown transformations automatically.
- Code changes must adhere to TDD: write failing unit test first, verify failure, implement minimal code, verify pass, commit.

---

### Task 1: Dual-Font Typography Setup (`YekanBakh` + Monospace)

**Files:**
- Create: `tabby-terminal/src/fonts/YekanBakh-Regular.ttf` (copied from `YekanBakh4 Pro/Font Family/ttf/YekanBakh-Regular.ttf`)
- Create: `tabby-terminal/src/fonts/YekanBakh-Bold.ttf` (copied from `YekanBakh4 Pro/Font Family/ttf/YekanBakh-Bold.ttf`)
- Modify: `tabby-terminal/src/frontends/xterm.css`
- Modify: `tabby-core/src/utils.ts:20-29`
- Test: `tabby-terminal/src/features/persian/fontSetup.spec.ts`

**Interfaces:**
- Consumes: Font files from `d:/Project/Tabby-New/YekanBakh4 Pro/`
- Produces: `@font-face` rules for `"YekanBakh"` with `unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;` and updated `getCSSFontFamily` returning `'YekanBakh'` in the fallback list.

- [ ] **Step 1: Write the failing test for font fallback chaining**

```typescript
// tabby-terminal/src/features/persian/fontSetup.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { getCSSFontFamily } from 'tabby-core/src/utils'

test('getCSSFontFamily includes YekanBakh in fallback chain', () => {
    const config = {
        terminal: {
            font: 'Source Code Pro',
            fallbackFont: null,
        },
    }
    const result = getCSSFontFamily(config)
    assert.match(result, /"Source Code Pro"/, 'Should contain primary font')
    assert.match(result, /"YekanBakh"/, 'Should contain YekanBakh fallback')
    assert.match(result, /"monospace-fallback"/, 'Should contain monospace-fallback')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/fontSetup.spec.ts`
Expected: FAIL (`AssertionError: Should contain YekanBakh fallback`)

- [ ] **Step 3: Copy font files and implement font configuration**

Copy `YekanBakh-Regular.ttf` and `YekanBakh-Bold.ttf` to `tabby-terminal/src/fonts/`.
In `tabby-terminal/src/frontends/xterm.css`:
```css
@font-face {
    font-family: "YekanBakh";
    src: url(../fonts/YekanBakh-Regular.ttf) format("truetype");
    font-weight: normal;
    font-style: normal;
    unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
}

@font-face {
    font-family: "YekanBakh";
    src: url(../fonts/YekanBakh-Bold.ttf) format("truetype");
    font-weight: bold;
    font-style: normal;
    unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
}
```

In `tabby-core/src/utils.ts`:
```typescript
export function getCSSFontFamily (config: any): string {
    let fonts: string[] = config.terminal.font.split(',').map(x => x.trim().replaceAll('"', ''))
    if (config.terminal.fallbackFont) {
        fonts.push(config.terminal.fallbackFont)
    }
    fonts.push('YekanBakh')
    fonts.push('monospace-fallback')
    fonts.push('monospace')
    fonts = fonts.map(x => `"${x}"`)
    return fonts.join(', ')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/fontSetup.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-terminal/src/fonts/ tabby-terminal/src/frontends/xterm.css tabby-core/src/utils.ts tabby-terminal/src/features/persian/fontSetup.spec.ts
git commit -m "feat(typography): add Yekan Bakh font with unicode-range fallback"
```

---

### Task 2: Persian Letter Shaping Engine (`persianReshaper`)

**Files:**
- Create: `tabby-terminal/src/features/persian/persianReshaper.ts`
- Test: `tabby-terminal/src/features/persian/persianReshaper.spec.ts`

**Interfaces:**
- Produces: `reshapePersian(text: string): string`
  Takes raw Persian text and returns contextual Presentation Forms glyphs (initial, medial, final, isolated).

- [ ] **Step 1: Write the failing test for Persian reshaping**

```typescript
// tabby-terminal/src/features/persian/persianReshaper.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { reshapePersian, isPersianChar } from './persianReshaper'

test('isPersianChar identifies Persian/Arabic unicode points', () => {
    assert.strictEqual(isPersianChar('س'), true)
    assert.strictEqual(isPersianChar('پ'), true)
    assert.strictEqual(isPersianChar('a'), false)
    assert.strictEqual(isPersianChar('1'), false)
})

test('reshapePersian connects letters properly into presentation forms', () => {
    // "سلام" (Seen: initial \uFEB3, Lam: medial \uFEDF or Ligature \uFEFB, Alef: final \uFE8E, Meem: isolated \uFEE1)
    const reshaped = reshapePersian('سلام')
    assert.notStrictEqual(reshaped, 'سلام', 'Should convert base chars to presentation forms')
    // First character should be initial Seen (\uFEB3)
    assert.strictEqual(reshaped.charCodeAt(0), 0xFEB3)
})

test('reshapePersian handles Persian specific letters: پ, چ, ژ, گ', () => {
    // "پروژه"
    const reshaped = reshapePersian('پروژه')
    // Peh initial (\uFB58), Reh isolated (\uFEAE), Waw isolated (\uFEED), Zheh isolated (\uFB8A), Heh final (\uFEEA)
    assert.strictEqual(reshaped.charCodeAt(0), 0xFB58)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/persianReshaper.spec.ts`
Expected: FAIL (`Cannot find module './persianReshaper'`)

- [ ] **Step 3: Implement `persianReshaper.ts`**

Write `tabby-terminal/src/features/persian/persianReshaper.ts` with complete character mapping tables (Arabic/Persian base characters -> isolated, final, initial, medial presentation forms) and context-sensitive forward/backward joining lookahead.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/persianReshaper.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-terminal/src/features/persian/persianReshaper.ts tabby-terminal/src/features/persian/persianReshaper.spec.ts
git commit -m "feat(persian): implement contextual letter shaping engine"
```

---

### Task 3: ANSI Sequence Preserver & Tokenizer (`ansiPreserver`)

**Files:**
- Create: `tabby-terminal/src/features/persian/ansiPreserver.ts`
- Test: `tabby-terminal/src/features/persian/ansiPreserver.spec.ts`

**Interfaces:**
- Produces: `processWithAnsi(input: string, textProcessor: (text: string) => string): string`
  Splits lines into ANSI tokens and printable text tokens, applies `textProcessor` to text tokens only, and reassembles the string without corrupting escape codes.

- [ ] **Step 1: Write the failing test for ANSI preservation**

```typescript
// tabby-terminal/src/features/persian/ansiPreserver.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { processWithAnsi, tokenizeAnsi } from './ansiPreserver'

test('tokenizeAnsi separates escape sequences from text content', () => {
    const input = '\x1b[32mHello\x1b[0m World'
    const tokens = tokenizeAnsi(input)
    assert.deepStrictEqual(tokens, [
        { type: 'ansi', value: '\x1b[32m' },
        { type: 'text', value: 'Hello' },
        { type: 'ansi', value: '\x1b[0m' },
        { type: 'text', value: ' World' },
    ])
})

test('processWithAnsi transforms text while keeping ANSI intact', () => {
    const input = '\x1b[1;31mError\x1b[0m: Failed'
    const result = processWithAnsi(input, t => t.toUpperCase())
    assert.strictEqual(result, '\x1b[1;31mERROR\x1b[0m: FAILED')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/ansiPreserver.spec.ts`
Expected: FAIL (`Cannot find module './ansiPreserver'`)

- [ ] **Step 3: Implement `ansiPreserver.ts`**

Write `tabby-terminal/src/features/persian/ansiPreserver.ts` with robust ANSI CSI (`\x1b[[0-9;?]*[a-zA-Z]`), OSC (`\x1b].*?\x07`), and escape code regex parsing.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/ansiPreserver.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-terminal/src/features/persian/ansiPreserver.ts tabby-terminal/src/features/persian/ansiPreserver.spec.ts
git commit -m "feat(persian): implement ANSI escape sequence tokenizer and preserver"
```

---

### Task 4: Persian BiDi Visual Reordering Engine (`persianBidi`)

**Files:**
- Create: `tabby-terminal/src/features/persian/persianBidi.ts`
- Test: `tabby-terminal/src/features/persian/persianBidi.spec.ts`

**Interfaces:**
- Consumes: `reshapePersian` from `persianReshaper.ts`, `processWithAnsi` from `ansiPreserver.ts`
- Produces: `processBidiLine(line: string): string`
  Performs visual reordering for mixed LTR/RTL lines with English command preservation.

- [ ] **Step 1: Write the failing test for BiDi processing**

```typescript
// tabby-terminal/src/features/persian/persianBidi.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { processBidiLine } from './persianBidi'

test('processBidiLine reverses pure Persian visual order for LTR cell grid', () => {
    const input = 'سلام'
    const output = processBidiLine(input)
    // The letters should be reshaped and reversed in visual output
    assert.notStrictEqual(output, 'سلام')
})

test('processBidiLine preserves English commands in mixed sentences', () => {
    const input = 'دستور npm run build اجرا شد'
    const output = processBidiLine(input)
    assert.match(output, /npm run build/, 'English command must retain LTR order')
})

test('processBidiLine preserves numbers in LTR order within Persian text', () => {
    const input = 'پورت 8080 باز است'
    const output = processBidiLine(input)
    assert.match(output, /8080/, 'Numbers must stay in natural LTR order')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/persianBidi.spec.ts`
Expected: FAIL (`Cannot find module './persianBidi'`)

- [ ] **Step 3: Implement `persianBidi.ts`**

Write `tabby-terminal/src/features/persian/persianBidi.ts` combining tokenization, span classification (RTL Persian vs LTR English/digits/symbols), reshaping RTL spans, and assembling visual bidirectional order.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-terminal/src/features/persian/persianBidi.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-terminal/src/features/persian/persianBidi.ts tabby-terminal/src/features/persian/persianBidi.spec.ts
git commit -m "feat(persian): implement BiDi visual reordering with mixed-text preservation"
```

---

### Task 5: Agent Markdown Stream Styler (`agentMarkdownStyler`)

**Files:**
- Create: `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts`
- Test: `tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`

**Interfaces:**
- Produces: `class AgentMarkdownStyler`
  Methods: `processChunk(data: string): string`, `isAlternateScreen(): boolean`

- [ ] **Step 1: Write the failing test for Markdown stream styler**

```typescript
// tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { AgentMarkdownStyler } from './agentMarkdownStyler'

test('AgentMarkdownStyler styles Markdown headings with bold and glyphs', () => {
    const styler = new AgentMarkdownStyler()
    const result = styler.processLine('# System Report')
    assert.match(result, /\x1b\[1;36m◆ System Report\x1b\[0m/)
})

test('AgentMarkdownStyler transforms fenced code blocks into Box-Drawing borders', () => {
    const styler = new AgentMarkdownStyler()
    const start = styler.processLine('```typescript')
    assert.match(start, /┌─.*typescript.*┐/)

    const code = styler.processLine('const x = 10;')
    assert.match(code, /│.*const x = 10;/)

    const end = styler.processLine('```')
    assert.match(end, /└─.*┘/)
})

test('AgentMarkdownStyler formats inline code and bold', () => {
    const styler = new AgentMarkdownStyler()
    const result = styler.processLine('This is **important** and `variable`')
    assert.match(result, /\x1b\[1mimportant\x1b\[22m/)
    assert.match(result, /variable/)
})

test('AgentMarkdownStyler bypasses processing in alternate screen buffer mode', () => {
    const styler = new AgentMarkdownStyler()
    styler.handleTerminalSequence('\x1b[?1049h') // Enter alternate screen
    assert.strictEqual(styler.isAlternateScreen(), true)
    const rawLine = '# Should not format'
    assert.strictEqual(styler.processLine(rawLine), rawLine)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`
Expected: FAIL (`Cannot find module './agentMarkdownStyler'`)

- [ ] **Step 3: Implement `agentMarkdownStyler.ts`**

Write `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts` with state machine handling headers, code blocks with Box-Drawing characters, inline code, bold, quotes, and alternate screen detection.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-terminal/src/features/markdown/agentMarkdownStyler.ts tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts
git commit -m "feat(markdown): implement streaming Markdown styler with box drawing and alt-screen guard"
```

---

### Task 6: Session Middleware Integration (`PersianAgentMiddleware`)

**Files:**
- Create: `tabby-terminal/src/middleware/persianAgentMiddleware.ts`
- Modify: `tabby-terminal/src/session.ts:25-45`
- Test: `tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`

**Interfaces:**
- Consumes: `AgentMarkdownStyler`, `processBidiLine`, `SessionMiddleware`
- Produces: `class PersianAgentMiddleware extends SessionMiddleware`

- [ ] **Step 1: Write the failing test for PersianAgentMiddleware**

```typescript
// tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { PersianAgentMiddleware } from './persianAgentMiddleware'

test('PersianAgentMiddleware processes output stream with Markdown and BiDi', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: true, enableAgentMarkdown: true })
    let received = ''
    middleware.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    middleware.feedFromSession(Buffer.from('# گزارش سیستم\n'))
    assert.ok(received.length > 0)
    assert.match(received, /◆/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`
Expected: FAIL (`Cannot find module './persianAgentMiddleware'`)

- [ ] **Step 3: Implement `persianAgentMiddleware.ts` and integrate in `session.ts`**

Create `tabby-terminal/src/middleware/persianAgentMiddleware.ts`:
Buffers incoming stream by line, applies markdown styler, then applies BiDi processor, flushes on newline or debounce interval.
In `tabby-terminal/src/session.ts`:
Allow attaching `PersianAgentMiddleware` when session options dictate.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-terminal/src/middleware/persianAgentMiddleware.ts tabby-terminal/src/session.ts tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts
git commit -m "feat(middleware): integrate PersianAgentMiddleware into session pipeline"
```

---

### Task 7: Profile & Preset Registration (`Persian & Agent Terminal`)

**Files:**
- Modify: `tabby-local/src/profiles.ts:35-50`
- Modify: `tabby-local/src/api.ts`
- Test: `tabby-local/src/profiles.spec.ts`

**Interfaces:**
- Produces: Builtin profile `local:persian-agent` in `LocalProfilesService.getBuiltinProfiles()`.

- [ ] **Step 1: Write the failing test for profile registration**

```typescript
// tabby-local/src/profiles.spec.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { LocalProfilesService } from './profiles'

test('LocalProfilesService includes Persian & Agent Terminal builtin profile', async () => {
    const mockApp: any = {}
    const mockConfig: any = { store: {} }
    const mockShellProviders: any[] = [{
        id: 'powershell',
        name: 'PowerShell',
        provide: async () => [{ id: 'powershell', name: 'PowerShell', command: 'powershell.exe' }],
    }]
    const service = new LocalProfilesService(mockApp, mockConfig, mockShellProviders)
    const profiles = await service.getBuiltinProfiles()
    const persianProfile = profiles.find(p => p.id === 'local:persian-agent')
    assert.ok(persianProfile, 'Should register local:persian-agent profile')
    assert.strictEqual(persianProfile.name, 'Persian & Agent Terminal')
    assert.strictEqual(persianProfile.options?.enablePersianBidi, true)
    assert.strictEqual(persianProfile.options?.enableAgentMarkdown, true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tabby-local/src/profiles.spec.ts`
Expected: FAIL (`AssertionError: Should register local:persian-agent profile`)

- [ ] **Step 3: Implement profile registration in `tabby-local/src/profiles.ts`**

Register `local:persian-agent` in `getBuiltinProfiles()`, setting icon to `fas fa-robot`, `name` to `'Persian & Agent Terminal'`, and default options with `enablePersianBidi: true`, `enableAgentMarkdown: true`, and `useYekanFont: true`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tabby-local/src/profiles.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tabby-local/src/profiles.ts tabby-local/src/profiles.spec.ts
git commit -m "feat(profile): register Persian & Agent Terminal builtin profile"
```

---

### Task 8: Full Verification Suite & Knowledge Graph Synchronization

**Files:**
- All tests across `tabby-terminal` and `tabby-local`
- Knowledge Graph: `tabby-persian/graphify-out/`

- [ ] **Step 1: Execute all unit test suites**

Run:
```powershell
node --experimental-strip-types tabby-terminal/src/features/persian/fontSetup.spec.ts
node --experimental-strip-types tabby-terminal/src/features/persian/persianReshaper.spec.ts
node --experimental-strip-types tabby-terminal/src/features/persian/ansiPreserver.spec.ts
node --experimental-strip-types tabby-terminal/src/features/persian/persianBidi.spec.ts
node --experimental-strip-types tabby-terminal/src/features/markdown/agentMarkdownStyler.spec.ts
node --experimental-strip-types tabby-terminal/src/middleware/persianAgentMiddleware.spec.ts
node --experimental-strip-types tabby-local/src/profiles.spec.ts
```
Expected: All 7 suites PASS with 0 failures.

- [ ] **Step 2: Run incremental knowledge graph synchronization**

Run:
```powershell
& "C:\Users\Hu-06\AppData\Local\Programs\Python\Python314\python.exe" -m graphify.cli --update
```
Expected: Updates `graph.json` and `GRAPH_REPORT.md` with new classes and relationships.

- [ ] **Step 3: Commit and complete**

```bash
git add graphify-out/
git commit -m "chore(graph): synchronize knowledge graph after Persian Agent Terminal implementation"
```
