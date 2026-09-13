import test from 'node:test'
import assert from 'node:assert/strict'
import { processBidiLine, processBidiText, isRTL } from './persianBidi.ts'

test('isRTL detects presence of Persian characters', () => {
    assert.strictEqual(isRTL('سلام دنیا'), true)
    assert.strictEqual(isRTL('hello world'), false)
})

test('processBidiLine on pure Persian text reshapes and visually reverses for LTR cell grid', () => {
    const input = 'سلام'
    const output = processBidiLine(input)
    assert.notStrictEqual(output, 'سلام')
    // In visual LTR order, the initial Seen should be rendered appropriately
    assert.ok(output.length > 0)
})

test('processBidiLine preserves English commands in mixed lines', () => {
    const input = 'دستور npm run build اجرا شد'
    const output = processBidiLine(input)
    assert.match(output, /npm run build/, 'English command must retain LTR order')
})

test('processBidiLine preserves numbers in natural LTR order', () => {
    const input = 'پورت 8080 فعال شد'
    const output = processBidiLine(input)
    assert.match(output, /8080/, 'Digits must remain in LTR order')
})

test('processBidiLine preserves ANSI color sequences around Persian words', () => {
    const input = '\x1b[32mسلام\x1b[0m دنیا'
    const output = processBidiLine(input)
    assert.match(output, /\x1b\[32m.*?\x1b\[0m/)
})

test('processBidiText processes multiline text', () => {
    const input = 'خط اول\nخط دوم'
    const output = processBidiText(input)
    assert.strictEqual(output.split('\n').length, 2)
})

test('processBidiLine returns unmodified text when no RTL characters are present', () => {
    const input = 'git status --short'
    const output = processBidiLine(input)
    assert.strictEqual(output, input)
})

test('processBidiLine preserves LTR prefix in mixed lines', () => {
    const input = '[INFO] پورت 8080 فعال شد'
    const output = processBidiLine(input)
    assert.match(output, /\[INFO\]/)
    assert.match(output, /8080/)
})

test('processBidiLine handles empty or falsy input', () => {
    assert.strictEqual(processBidiLine(''), '')
    // @ts-expect-error testing falsy inputs
    assert.strictEqual(processBidiLine(null), '')
})

test('processBidiText preserves CRLF line endings', () => {
    const input = 'خط اول\r\nخط دوم'
    const output = processBidiText(input)
    assert.strictEqual(output.split('\r\n').length, 2)
})

test('processBidiLine preserves brackets with mirroring in Persian context', () => {
    const input = '(پیام مهم)'
    const output = processBidiLine(input)
    assert.ok(output.includes('(') && output.includes(')'))
})
