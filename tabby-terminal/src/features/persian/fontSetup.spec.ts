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
