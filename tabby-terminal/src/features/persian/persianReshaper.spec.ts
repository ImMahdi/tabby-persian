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
    const reshaped = reshapePersian('سلام')
    assert.notStrictEqual(reshaped, 'سلام')
    assert.strictEqual(reshaped.charCodeAt(0), 0xFEB3) // Initial Seen
})

test('reshapePersian handles Persian specific letters: پ, چ, ژ, گ', () => {
    const reshaped = reshapePersian('پروژه')
    assert.strictEqual(reshaped.charCodeAt(0), 0xFB58) // Initial Peh
})

test('reshapePersian handles non-connecting letters', () => {
    const reshaped = reshapePersian('درود')
    assert.ok(reshaped.length > 0)
})

test('reshapePersian handles Lam-Alef ligatures properly', () => {
    const isolatedLamAlef = reshapePersian('لا')
    assert.strictEqual(isolatedLamAlef.charCodeAt(0), 0xFEFB) // Isolated Lam-Alef

    const connectedLamAlef = reshapePersian('بلا')
    assert.strictEqual(connectedLamAlef.charCodeAt(0), 0xFE91) // Initial Beh
    assert.strictEqual(connectedLamAlef.charCodeAt(1), 0xFEFC) // Final Lam-Alef
})

test('reshapePersian handles Persian specific letters: چ, گ, ک, ی in all positions', () => {
    // Tcheh initial, Sheen medial, Meem final
    const chashm = reshapePersian('چشم')
    assert.strictEqual(chashm.charCodeAt(0), 0xFB7C) // Initial Tcheh
    assert.strictEqual(chashm.charCodeAt(1), 0xFEB8) // Medial Sheen
    assert.strictEqual(chashm.charCodeAt(2), 0xFEE2) // Final Meem

    // Gaf initial, Reh final, Gaf isolated
    const gorg = reshapePersian('گرگ')
    assert.strictEqual(gorg.charCodeAt(0), 0xFB94) // Initial Gaf
    assert.strictEqual(gorg.charCodeAt(1), 0xFEAE) // Final Reh
    assert.strictEqual(gorg.charCodeAt(2), 0xFB92) // Isolated Gaf

    // Keheh initial, Meem medial, Keheh final
    const komak = reshapePersian('کمک')
    assert.strictEqual(komak.charCodeAt(0), 0xFB90) // Initial Keheh
    assert.strictEqual(komak.charCodeAt(1), 0xFEE4) // Medial Meem
    assert.strictEqual(komak.charCodeAt(2), 0xFB8F) // Final Keheh
})

test('reshapePersian handles ZWNJ (Zero Width Non-Joiner / نیم‌فاصله)', () => {
    const reshaped = reshapePersian('می‌شود')
    assert.strictEqual(reshaped.charCodeAt(0), 0xFEE3) // Initial Meem
    assert.strictEqual(reshaped.charCodeAt(1), 0xFBFD) // Final Farsi Yeh
    assert.strictEqual(reshaped.charCodeAt(2), 0x200C) // ZWNJ preserved
    assert.strictEqual(reshaped.charCodeAt(3), 0xFEB7) // Initial Sheen
    assert.strictEqual(reshaped.charCodeAt(4), 0xFEEE) // Final Waw
    assert.strictEqual(reshaped.charCodeAt(5), 0xFEA9) // Isolated Dal
})

test('reshapePersian preserves non-Persian characters and transparent marks', () => {
    const mixed = reshapePersian('hello سلام 123')
    assert.ok(mixed.startsWith('hello '))
    assert.ok(mixed.endsWith(' 123'))
    assert.strictEqual(mixed.charCodeAt(6), 0xFEB3) // Initial Seen
})
