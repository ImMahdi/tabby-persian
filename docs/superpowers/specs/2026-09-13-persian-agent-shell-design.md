# Design Specification: Persian & CLI Agent Terminal Preset for Tabby

- **Date:** 2026-09-13
- **Author:** Pair Programming (Antigravity & User)
- **Status:** Approved / In Design
- **Target Systems:** `tabby-terminal`, `tabby-local`, `tabby-core`

---

## 1. Overview and Problem Statement

### 1.1 Context
Tabby Terminal is a modular, extensible terminal emulator built on Angular, Electron, TypeScript, and `@xterm/xterm`. While it excels in cross-platform terminal management, it has two key gaps for modern Persian development workflows:
1. **Persian & Bidirectional (BiDi) Rendering:** Standard VT100 / xterm cell grids render characters Left-to-Right (LTR) in disconnected glyph forms. Persian text appears reversed and disconnected (e.g. `ب ا م` instead of `بام`).
2. **CLI Agent Output Styling:** Modern AI coding agents (`claude-code`, `agy`, `codex`, `opencode`, etc.) stream responses formatted in Markdown. Raw terminals display markdown markers (`#`, `**`, ```` ``` ````) without rich styling, syntax boundaries, or visual separation.
3. **Typography:** Standard monospace coding fonts lack aesthetic Persian glyphs. Persian text must use the contemporary "Yekan Bakh" font without distorting English code indentation, ASCII art, or CLI commands.

### 1.2 Objective
Introduce a dedicated, built-in shell preset: **"Persian & Agent Terminal"** (`local:persian-agent`), which equips the session stream with:
- Intelligent Persian letter shaping and bidirectional reordering that preserves ANSI escapes and mixed English/Persian sentences.
- Real-time ANSI & Box-Drawing Markdown transformation for CLI agent outputs.
- A Dual-Font typography engine where English text remains in the crisp monospaced code font while Persian characters seamlessly render in **Yekan Bakh** via CSS `unicode-range`.
- Zero disruption to existing standard profiles (`PowerShell`, `CMD`, `WSL`, `SSH`), which remain fully intact.

---

## 2. Architectural Blueprint

```
+-------------------------------------------------------------------------+
|                              PTY / Agent Process                        |
|                    (PowerShell / WSL / Claude / agy / ...)              |
+------------------------------------+------------------------------------+
                                     | stdout (data stream)
                                     v
+-------------------------------------------------------------------------+
|                  BaseSession: SessionMiddlewareStack                    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |             PersianAgentMiddleware (SessionMiddleware)            |  |
|  |                                                                   |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  | 1. Alternate Screen Guard                                   |  |  |
|  |  |    (Passes raw stream through if in vim/nano/htop)          |  |  |
|  |  +------------------------------+------------------------------+  |  |
|  |                                 |                                 |  |
|  |                                 v                                 |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  | 2. Agent Markdown Styler                                    |  |  |
|  |  |    - Headers (#, ##) -> Bold ANSI + Indicator Glyphs        |  |  |
|  |  |    - Code Blocks (```) -> Box-Drawing borders (┌─, │, └─)   |  |  |
|  |  |    - Inline (`code`, **bold**, *italic*, > quotes)         |  |  |
|  |  +------------------------------+------------------------------+  |  |
|  |                                 |                                 |  |
|  |                                 v                                 |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  | 3. Persian BiDi & Reshaper Engine                           |  |  |
|  |  |    - Tokenizes ANSI escape sequences                        |  |  |
|  |  |    - Shapes Persian characters (Presentation Forms-B)       |  |  |
|  |  |    - Visual BiDi reordering for mixed LTR/RTL lines         |  |  |
|  |  |    - Reassembles ANSI codes in exact semantic order         |  |  |
|  |  +-------------------------------------------------------------+  |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------+------------------------------------+
                                     | Processed Stream
                                     v
+-------------------------------------------------------------------------+
|                       XTermFrontend / @xterm/xterm                      |
|                                                                         |
|  Typography: Dual-Font Stack via CSS `unicode-range`                    |
|  - ASCII / Code / English -> User Monospace Font (Source Code Pro, etc.)|
|  - Persian Glyphs (U+0600-06FF, U+FB50-FEFF) -> Yekan Bakh Regular/Bold |
+-------------------------------------------------------------------------+
```

---

## 3. Subsystem Detailed Designs

### 3.1 Subsystem 1: Dual-Font Typography (`YekanBakh` + Monospace)

#### 3.1.1 Asset Placement
The font files located in `YekanBakh4 Pro/Font Family/ttf/` are integrated into `tabby-terminal/src/fonts/`:
- `YekanBakh-Regular.ttf`
- `YekanBakh-Bold.ttf`

#### 3.1.2 CSS Font-Face Declaration
In `tabby-terminal/src/frontends/xterm.css`, `@font-face` rules are registered targeting only the Arabic/Persian Unicode blocks:
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

#### 3.1.3 Font Chaining
In `tabby-core/src/utils.ts` (`getCSSFontFamily`), when the preset is configured, `"YekanBakh"` is included in the fallback chain directly after the primary monospaced font:
```typescript
fonts = [userMonospaceFont, 'YekanBakh', 'monospace-fallback', 'monospace']
```
- **Behavioral Guarantee:**
  - All ASCII characters, numbers in shell commands (`8080`, `-n 10`), code brackets, and ASCII art continue to render with the monospaced font.
  - All Persian characters render crisply with Yekan Bakh.

---

### 3.2 Subsystem 2: Persian BiDi & Letter Shaping Engine

#### 3.2.1 Responsibilities
Located in `tabby-terminal/src/features/persian/`:
- `persianReshaper.ts`: Contextual character joining (isolated, initial, medial, final) targeting Unicode Arabic Presentation Forms-B (`U+FE70-FEFF`) and Presentation Forms-A (`U+FB50-FDFF`).
- `persianBidi.ts`: Line-level visual reordering adhering to the Unicode Bidirectional Algorithm (UBA).
- `ansiPreserver.ts`: Tokenizer that splits stream lines into ANSI sequences and plain text tokens, applies shaping/BiDi solely to the text tokens, and reconstructs the line preserving exact ANSI styles and control codes.

#### 3.2.2 Mixed LTR/RTL Logic
For a line such as:
`اجرای دستور npm run build با موفقیت پایان یافت.`
1. ANSI sequences are isolated.
2. Persian spans (`اجرای دستور `, ` با موفقیت پایان یافت.`) are identified and reshaped.
3. English spans (`npm run build`) remain strictly LTR.
4. Visual ordering places the spans in natural reading order so that xterm's LTR cell grid displays the line correctly from Right to Left, with the English command read in normal LTR sequence.

---

### 3.3 Subsystem 3: Agent Markdown Styler

#### 3.3.1 Responsibilities
Located in `tabby-terminal/src/features/markdown/agentMarkdownStyler.ts`:
- Operates as a streaming line processor.
- Tracks state: `NORMAL`, `CODE_BLOCK`, `BLOCKQUOTE`, `TABLE`.

#### 3.3.2 Transformation Specifications
1. **Headings:**
   - `# Title` -> `\x1b[1;36m◆ Title\x1b[0m\r\n`
   - `## Subtitle` -> `\x1b[1;35m▸ Subtitle\x1b[0m\r\n`
   - `### Section` -> `\x1b[1;33m● Section\x1b[0m\r\n`
2. **Fenced Code Blocks:**
   - On ```` ```[lang] ````: Emits `\x1b[38;5;244m┌─ [\x1b[38;5;220m[lang]\x1b[38;5;244m] ──────────────────────────────────┐\x1b[0m\r\n`
   - Inside block: Prefixes lines with `\x1b[38;5;244m│ \x1b[0m`
   - On ```` ``` ````: Emits `\x1b[38;5;244m└─────────────────────────────────────────────────┘\x1b[0m\r\n`
3. **Inline Formatting:**
   - `**bold**` -> `\x1b[1mbold\x1b[22m`
   - `*italic*` -> `\x1b[3mitalic\x1b[23m`
   - `` `inline_code` `` -> `\x1b[48;5;236m\x1b[38;5;223m inline_code \x1b[0m`
4. **Blockquotes:**
   - `> Quote text` -> `\x1b[38;5;39m│\x1b[0m \x1b[3mQuote text\x1b[23m`
5. **Horizontal Rules:**
   - `---` or `***` -> `\x1b[38;5;240m──────────────────────────────────────────────────\x1b[0m`

#### 3.3.3 Safety & Bypass Rules
- **Alternate Screen Buffer Detection:** Checks if the terminal is in alternate screen mode (`\x1b[?1049h` / `isAlternateScreenActive`). When active, all markdown processing is bypassed, guaranteeing zero interference with `vim`, `nano`, `htop`, or interactive CLI menus.
- **PTY Prompt Protection:** If a line does not originate from an agent response or matches raw command input, markdown transformation is skipped.

---

### 3.4 Subsystem 4: Preset Definition & Session Integration

#### 3.4.1 Profile Definition
In `tabby-local/src/profiles.ts`, a new builtin profile is registered:
```typescript
{
    id: 'local:persian-agent',
    type: 'local',
    name: 'Persian & Agent Terminal',
    icon: 'fas fa-robot',
    options: {
        command: '', // system default shell
        enablePersianBidi: true,
        enableAgentMarkdown: true,
        useYekanFont: true,
    },
    isBuiltin: true,
}
```

#### 3.4.2 Middleware Wiring
In `tabby-terminal/src/session.ts`:
When a session is initialized, if the profile options have `enablePersianBidi` or `enableAgentMarkdown`, `PersianAgentMiddleware` is pushed onto `this.middleware`:
```typescript
if (profile.options?.enablePersianBidi || profile.options?.enableAgentMarkdown) {
    this.middleware.push(new PersianAgentMiddleware(profile.options))
}
```

---

## 4. Verification & Testing Plan

### 4.1 Automated Unit Tests
- **`persianReshaper.spec.ts`:**
  - Test isolated Persian words (e.g. `سلام`, `توسعه`, `پروژه`) produce exact Unicode presentation form sequences.
  - Test Arabic diacritics and Persian-specific letters (`پ`, `چ`, `ژ`, `گ`, `ی`, `ک`).
- **`persianBidi.spec.ts`:**
  - Test pure Persian line visual ordering.
  - Test mixed Persian and English command sentences (`اجرای دستور npm run build`).
  - Test numbers in Persian sentences (`پورت 8080 فعال شد`).
- **`ansiPreserver.spec.ts`:**
  - Test that ANSI 256-color and 24-bit RGB codes (`\x1b[38;2;...m`) are preserved without corruption around reshaped Persian text.
- **`agentMarkdownStyler.spec.ts`:**
  - Test streaming code block opening, indentation, and closing box drawing.
  - Test headings and inline formatting replacement.
  - Test alternate screen bypass sequence (`\x1b[?1049h`).

### 4.2 Manual / Integration Verification
- Open Tabby New Tab -> Select **"Persian & Agent Terminal"**.
- Verify typing Persian in terminal renders connected, legible letters in Yekan Bakh font.
- Verify English commands (`dir`, `ls`, `git status`) render in monospace font.
- Run an agent command (`agy`, `claude`, or a test script emitting Markdown) and verify:
  - Headers, bold, quotes, and code blocks render with boxes and ANSI styles.
  - Persian sentences inside markdown render right-to-left and joined.
- Open `nano` or `vim` inside the session and verify alternate screen bypass operates seamlessly.

---

## 5. Implementation Phasing
- **Phase 1:** Dual-Font assets & `@font-face` styling (`YekanBakh` integration).
- **Phase 2:** Persian Letter Shaping & BiDi engine (`persianReshaper`, `persianBidi`, `ansiPreserver`).
- **Phase 3:** Agent Markdown Styler (`agentMarkdownStyler`).
- **Phase 4:** `PersianAgentMiddleware` and Profile registration (`tabby-local`, `tabby-terminal`).
- **Phase 5:** Full test suite execution and live verification.
