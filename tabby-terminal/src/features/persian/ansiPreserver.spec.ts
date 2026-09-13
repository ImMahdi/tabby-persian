import test from 'node:test'
import assert from 'node:assert/strict'
import { processWithAnsi, tokenizeAnsi, stripAnsi, hasAnsi } from './ansiPreserver'

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

test('tokenizeAnsi handles complex 256-color and 24-bit RGB codes', () => {
    const input = '\x1b[38;2;255;100;50mRGB\x1b[38;5;208m256\x1b[0m'
    const tokens = tokenizeAnsi(input)
    assert.strictEqual(tokens.filter(t => t.type === 'text').map(t => t.value).join(''), 'RGB256')
})

test('stripAnsi removes all escape codes', () => {
    assert.strictEqual(stripAnsi('\x1b[32mGreen\x1b[0m'), 'Green')
})

test('hasAnsi detects presence of escape codes', () => {
    assert.strictEqual(hasAnsi('\x1b[32mGreen\x1b[0m'), true)
    assert.strictEqual(hasAnsi('Plain text'), false)
})

test('tokenizeAnsi handles OSC sequences and cursor control codes', () => {
    const oscInput = '\x1b]0;Tabby Terminal\x07Prompt: \x1b[2K\x1b[1A\x1b[?25hDone'
    const tokens = tokenizeAnsi(oscInput)
    const textOnly = tokens.filter(t => t.type === 'text').map(t => t.value).join('')
    assert.strictEqual(textOnly, 'Prompt: Done')
    assert.strictEqual(hasAnsi(oscInput), true)
    assert.strictEqual(stripAnsi(oscInput), 'Prompt: Done')
})

test('tokenizeAnsi handles consecutive ANSI codes without text between them', () => {
    const input = '\x1b[31m\x1b[1mBoldRed\x1b[0m'
    const tokens = tokenizeAnsi(input)
    assert.deepStrictEqual(tokens, [
        { type: 'ansi', value: '\x1b[31m' },
        { type: 'ansi', value: '\x1b[1m' },
        { type: 'text', value: 'BoldRed' },
        { type: 'ansi', value: '\x1b[0m' },
    ])
})

test('processWithAnsi handles string with no ANSI codes', () => {
    const input = 'pure text'
    const result = processWithAnsi(input, t => t.toUpperCase())
    assert.strictEqual(result, 'PURE TEXT')
})

test('processWithAnsi handles empty string', () => {
    assert.strictEqual(processWithAnsi('', t => t.toUpperCase()), '')
})
