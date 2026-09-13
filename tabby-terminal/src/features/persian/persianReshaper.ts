/**
 * Persian Letter Shaping Engine (persianReshaper)
 *
 * Implements contextual letter shaping for Persian and Arabic scripts,
 * converting raw Unicode characters into their contextual Presentation Forms glyphs:
 * - Isolated
 * - Final
 * - Initial
 * - Medial
 *
 * Fully supports Persian-specific characters (پ, چ, ژ, گ, ک, ی) and Lam-Alef ligatures (لا, لأ, لإ, لآ).
 */

const JOINING_NONE = 0
const JOINING_RIGHT = 1
const JOINING_DUAL = 2

interface GlyphEntry {
    type: number
    forms: number[] // [isolated, final, initial?, medial?]
}

const CHAR_MAP = new Map<number, GlyphEntry>([
    // Arabic base characters
    [0x0621, { type: JOINING_NONE, forms: [0xFE80] }], // Hamza
    [0x0622, { type: JOINING_RIGHT, forms: [0xFE81, 0xFE82] }], // Alef with Madda Above
    [0x0623, { type: JOINING_RIGHT, forms: [0xFE83, 0xFE84] }], // Alef with Hamza Above
    [0x0624, { type: JOINING_RIGHT, forms: [0xFE85, 0xFE86] }], // Waw with Hamza Above
    [0x0625, { type: JOINING_RIGHT, forms: [0xFE87, 0xFE88] }], // Alef with Hamza Below
    [0x0626, { type: JOINING_DUAL, forms: [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C] }], // Yeh with Hamza Above
    [0x0627, { type: JOINING_RIGHT, forms: [0xFE8D, 0xFE8E] }], // Alef
    [0x0628, { type: JOINING_DUAL, forms: [0xFE8F, 0xFE90, 0xFE91, 0xFE92] }], // Beh
    [0x0629, { type: JOINING_RIGHT, forms: [0xFE93, 0xFE94] }], // Teh Marbuta
    [0x062A, { type: JOINING_DUAL, forms: [0xFE95, 0xFE96, 0xFE97, 0xFE98] }], // Teh
    [0x062B, { type: JOINING_DUAL, forms: [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C] }], // Theh
    [0x062C, { type: JOINING_DUAL, forms: [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0] }], // Jeem
    [0x062D, { type: JOINING_DUAL, forms: [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4] }], // Hah
    [0x062E, { type: JOINING_DUAL, forms: [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8] }], // Khaa
    [0x062F, { type: JOINING_RIGHT, forms: [0xFEA9, 0xFEAA] }], // Dal
    [0x0630, { type: JOINING_RIGHT, forms: [0xFEAB, 0xFEAC] }], // Dhal
    [0x0631, { type: JOINING_RIGHT, forms: [0xFEAD, 0xFEAE] }], // Reh
    [0x0632, { type: JOINING_RIGHT, forms: [0xFEAF, 0xFEB0] }], // Zain
    [0x0633, { type: JOINING_DUAL, forms: [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4] }], // Seen
    [0x0634, { type: JOINING_DUAL, forms: [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8] }], // Sheen
    [0x0635, { type: JOINING_DUAL, forms: [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC] }], // Saad
    [0x0636, { type: JOINING_DUAL, forms: [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0] }], // Daad
    [0x0637, { type: JOINING_DUAL, forms: [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4] }], // Tah
    [0x0638, { type: JOINING_DUAL, forms: [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8] }], // Zah
    [0x0639, { type: JOINING_DUAL, forms: [0xFEC9, 0xFECA, 0xFECB, 0xFECC] }], // Ain
    [0x063A, { type: JOINING_DUAL, forms: [0xFECD, 0xFECE, 0xFECF, 0xFED0] }], // Ghain
    [0x0640, { type: JOINING_DUAL, forms: [0x0640, 0x0640, 0x0640, 0x0640] }], // Tatweel / Kashida
    [0x0641, { type: JOINING_DUAL, forms: [0xFED1, 0xFED2, 0xFED3, 0xFED4] }], // Feh
    [0x0642, { type: JOINING_DUAL, forms: [0xFED5, 0xFED6, 0xFED7, 0xFED8] }], // Qaf
    [0x0643, { type: JOINING_DUAL, forms: [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC] }], // Arabic Kaf
    [0x0644, { type: JOINING_DUAL, forms: [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0] }], // Lam
    [0x0645, { type: JOINING_DUAL, forms: [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4] }], // Meem
    [0x0646, { type: JOINING_DUAL, forms: [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8] }], // Noon
    [0x0647, { type: JOINING_DUAL, forms: [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC] }], // Heh
    [0x0648, { type: JOINING_RIGHT, forms: [0xFEED, 0xFEEE] }], // Waw
    [0x0649, { type: JOINING_RIGHT, forms: [0xFEEF, 0xFEF0] }], // Alef Maksura
    [0x064A, { type: JOINING_DUAL, forms: [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4] }], // Arabic Yeh

    // Persian specific characters
    [0x067E, { type: JOINING_DUAL, forms: [0xFB56, 0xFB57, 0xFB58, 0xFB59] }], // Peh (پ)
    [0x0686, { type: JOINING_DUAL, forms: [0xFB7A, 0xFB7B, 0xFB7C, 0xFB7D] }], // Tcheh (چ)
    [0x0698, { type: JOINING_RIGHT, forms: [0xFB8A, 0xFB8B] }], // Zheh (ژ)
    [0x06A9, { type: JOINING_DUAL, forms: [0xFB8E, 0xFB8F, 0xFB90, 0xFB91] }], // Keheh / Persian Kaf (ک)
    [0x06AF, { type: JOINING_DUAL, forms: [0xFB92, 0xFB93, 0xFB94, 0xFB95] }], // Gaf (گ)
    [0x06CC, { type: JOINING_DUAL, forms: [0xFBFC, 0xFBFD, 0xFBFE, 0xFBFF] }], // Farsi Yeh (ی)
    [0x06C0, { type: JOINING_RIGHT, forms: [0xFBA4, 0xFBA5] }], // Heh with Yeh Above (ۀ)

    // Additional extended Perso-Arabic characters
    [0x06C1, { type: JOINING_DUAL, forms: [0xFBA6, 0xFBA7, 0xFBA8, 0xFBA9] }], // Heh Goal
    [0x06C2, { type: JOINING_RIGHT, forms: [0xFBAA, 0xFBAB] }], // Heh Goal with Hamza Above
    [0x0679, { type: JOINING_DUAL, forms: [0xFB66, 0xFB67, 0xFB68, 0xFB69] }], // Tteh
    [0x0688, { type: JOINING_RIGHT, forms: [0xFB88, 0xFB89] }], // Ddal
    [0x0691, { type: JOINING_RIGHT, forms: [0xFB8C, 0xFB8D] }], // Rreh
    [0x06BA, { type: JOINING_RIGHT, forms: [0xFB9E, 0xFB9F] }], // Noon Ghunna
])

// Lam-Alef ligatures mapping: [isolated, final]
const LAM_ALEF_MAP: Record<number, [number, number]> = {
    0x0622: [0xFEF5, 0xFEF6], // Alef with Madda Above (لآ)
    0x0623: [0xFEF7, 0xFEF8], // Alef with Hamza Above (لأ)
    0x0625: [0xFEF9, 0xFEFA], // Alef with Hamza Below (لإ)
    0x0627: [0xFEFB, 0xFEFC], // Plain Alef (لا)
}

/**
 * Checks if a Unicode code point is a transparent combining mark (Tashkeel / Harakat).
 */
function isTashkeel (code: number): boolean {
    return (
        (code >= 0x0610 && code <= 0x061A) ||
        (code >= 0x064B && code <= 0x065F) ||
        code === 0x0670 ||
        (code >= 0x06D6 && code <= 0x06ED)
    )
}

/**
 * Returns true if character belongs to Persian/Arabic Unicode ranges.
 */
export function isPersianChar (char: string): boolean {
    if (!char || char.length === 0) {
        return false
    }
    const cp = char.codePointAt(0)!
    return (
        (cp >= 0x0600 && cp <= 0x06FF) ||
        (cp >= 0x0750 && cp <= 0x077F) ||
        (cp >= 0x08A0 && cp <= 0x08FF) ||
        (cp >= 0xFB50 && cp <= 0xFDFF) ||
        (cp >= 0xFE70 && cp <= 0xFEFF) ||
        cp === 0x200C || // ZWNJ
        cp === 0x200D    // ZWJ
    )
}

/**
 * Reshapes raw Persian/Arabic text into contextual Presentation Forms glyphs.
 * Handles initial, medial, final, isolated forms and Lam-Alef ligatures.
 */
export function reshapePersian (text: string): string {
    if (!text) {
        return text ?? ''
    }

    let result = ''
    let prevConnectsForward = false

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)

        // Preserve surrogate pairs without modification
        if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
            result += text[i] + text[i + 1]
            i++
            prevConnectsForward = false
            continue
        }

        // Transparent diacritics / Tashkeel do not affect or break connections
        if (isTashkeel(code)) {
            result += text[i]
            continue
        }

        // Zero-Width Non-Joiner (نیم‌فاصله) breaks connection
        if (code === 0x200C) {
            result += text[i]
            prevConnectsForward = false
            continue
        }

        // Zero-Width Joiner forces connection
        if (code === 0x200D) {
            result += text[i]
            prevConnectsForward = true
            continue
        }

        const entry = CHAR_MAP.get(code)
        if (!entry) {
            result += text[i]
            prevConnectsForward = false
            continue
        }

        const connectsBackward = prevConnectsForward && (entry.type === JOINING_RIGHT || entry.type === JOINING_DUAL)

        // Check for Lam-Alef ligature (لا, لأ, لإ, لآ)
        if (code === 0x0644) { // Lam
            let nextIdx = i + 1
            const skippedMarks: string[] = []
            while (nextIdx < text.length && isTashkeel(text.charCodeAt(nextIdx))) {
                skippedMarks.push(text[nextIdx])
                nextIdx++
            }
            if (nextIdx < text.length) {
                const nextCode = text.charCodeAt(nextIdx)
                const lamAlefPair = LAM_ALEF_MAP[nextCode]
                if (lamAlefPair) {
                    const ligCode = connectsBackward ? lamAlefPair[1] : lamAlefPair[0]
                    result += String.fromCharCode(ligCode)
                    for (const mark of skippedMarks) {
                        result += mark
                    }
                    // Lam-Alef ends with Alef which is right-joining, so it never connects forward
                    prevConnectsForward = false
                    i = nextIdx
                    continue
                }
            }
        }

        // Contextual lookahead: does current character connect forward to next?
        let connectsForward = false
        if (entry.type === JOINING_DUAL) {
            let nextIdx = i + 1
            while (nextIdx < text.length && isTashkeel(text.charCodeAt(nextIdx))) {
                nextIdx++
            }
            if (nextIdx < text.length) {
                const nextCode = text.charCodeAt(nextIdx)
                if (nextCode === 0x200D) { // ZWJ
                    connectsForward = true
                } else if (nextCode !== 0x200C) { // ZWNJ breaks
                    const nextEntry = CHAR_MAP.get(nextCode)
                    if (nextEntry && (nextEntry.type === JOINING_RIGHT || nextEntry.type === JOINING_DUAL)) {
                        connectsForward = true
                    }
                }
            }
        }

        // Presentation form selection:
        // Isolated: 0, Final: 1, Initial: 2, Medial: 3
        let formIndex = 0
        if (entry.type === JOINING_RIGHT) {
            formIndex = connectsBackward ? 1 : 0
        } else if (entry.type === JOINING_DUAL) {
            if (!connectsBackward && !connectsForward) {
                formIndex = 0
            } else if (connectsBackward && !connectsForward) {
                formIndex = 1
            } else if (!connectsBackward && connectsForward) {
                formIndex = 2
            } else {
                formIndex = 3
            }
        }

        result += String.fromCharCode(entry.forms[formIndex])
        prevConnectsForward = connectsForward
    }

    return result
}
