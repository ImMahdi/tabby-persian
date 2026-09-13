import test from 'node:test'
import assert from 'node:assert/strict'
import { AgentMarkdownStyler } from './agentMarkdownStyler.ts'

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
    assert.match(end, /└─*┘/)
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
    styler.handleTerminalSequence('\x1b[?1049l') // Exit alternate screen
    assert.strictEqual(styler.isAlternateScreen(), false)
})

test('AgentMarkdownStyler processes streaming chunks across lines', () => {
    const styler = new AgentMarkdownStyler()
    const chunk = '# Header\nSome **text** here\n```bash\necho 1\n```\n'
    const processed = styler.processChunk(chunk)
    assert.match(processed, /◆ Header/)
    assert.match(processed, /┌─/)
})

test('AgentMarkdownStyler formats H2 and H3 headings', () => {
    const styler = new AgentMarkdownStyler()
    assert.match(styler.processLine('## Sub Header'), /\x1b\[1;35m▸ Sub Header\x1b\[0m/)
    assert.match(styler.processLine('### Section'), /\x1b\[1;33m● Section\x1b\[0m/)
})

test('AgentMarkdownStyler formats blockquotes and horizontal rules', () => {
    const styler = new AgentMarkdownStyler()
    assert.match(styler.processLine('> This is a quote'), /\x1b\[38;5;39m│\x1b\[0m/)
    assert.match(styler.processLine('---'), /\x1b\[38;5;240m─{10,}\x1b\[0m/)
    assert.match(styler.processLine('***'), /\x1b\[38;5;240m─{10,}\x1b\[0m/)
})

test('AgentMarkdownStyler formats bullet list items', () => {
    const styler = new AgentMarkdownStyler()
    const item1 = styler.processLine('- First item')
    assert.match(item1, /•/)
    assert.match(item1, /First item/)

    const item2 = styler.processLine('* Second item')
    assert.match(item2, /•/)
    assert.match(item2, /Second item/)
})

test('AgentMarkdownStyler supports alternate screen switching via xterm 47 codes', () => {
    const styler = new AgentMarkdownStyler()
    styler.handleTerminalSequence('\x1b[?47h')
    assert.strictEqual(styler.isAlternateScreen(), true)
    assert.strictEqual(styler.processLine('# Untouched'), '# Untouched')
    styler.handleTerminalSequence('\x1b[?47l')
    assert.strictEqual(styler.isAlternateScreen(), false)
})

test('AgentMarkdownStyler buffers incomplete streaming lines', () => {
    const styler = new AgentMarkdownStyler()
    const part1 = styler.processChunk('# Incom')
    assert.strictEqual(part1, '')
    const part2 = styler.processChunk('plete Title\n')
    assert.match(part2, /◆ Incomplete Title/)
})
