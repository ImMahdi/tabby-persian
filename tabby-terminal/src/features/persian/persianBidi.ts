/**
 * Persian Bidirectional (BiDi) Visual Reordering Engine (persianBidi)
 *
 * Implements line-level visual reordering for terminal emulator cell grids (xterm.js),
 * ensuring:
 * 1. Persian text is reshaped into presentation forms and visually reversed for RTL reading.
 * 2. English words, CLI commands, file paths, and options remain strictly LTR.
 * 3. Numbers and digit sequences (e.g. ports, IP addresses) remain in natural LTR order.
 * 4. ANSI escape sequences are preserved and remain attached to their formatted text without corruption.
 * 5. Fast-path bypass for lines without Persian/Arabic characters.
 */

import { reshapePersian } from './persianReshaper'
import { tokenizeAnsi } from './ansiPreserver'

/**
 * Unicode range regular expression matching Arabic, Persian, and Hebrew characters.
 */
const RTL_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

/**
 * Checks if a string contains any Right-to-Left (Persian/Arabic/Hebrew) characters.
 */
export function isRTL (text: string): boolean {
    if (!text) {
        return false
    }
    return RTL_REGEX.test(text)
}

/**
 * Bracket and parenthesis mirroring pairs for RTL context.
 */
const BRACKET_MIRRORS: Record<string, string> = {
    '(': ')',
    ')': '(',
    '[': ']',
    ']': '[',
    '{': '}',
    '}': '{',
    '<': '>',
    '>': '<',
    '«': '»',
    '»': '«',
}

/**
 * Reshapes Persian letters into contextual presentation forms and reverses their visual
 * order for rendering in an LTR terminal grid, with bracket mirroring.
 */
function reshapePersianAndReverse (text: string): string {
    if (!text) {
        return ''
    }

    const reshaped = reshapePersian(text)
    const chars = Array.from(reshaped)
    const reversed: string[] = new Array(chars.length)

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[chars.length - 1 - i] ?? ''
        reversed[i] = (ch ? BRACKET_MIRRORS[ch] : undefined) || ch
    }

    return reversed.join('')
}

type SpanType = 'rtl' | 'ltr' | 'num' | 'sep'

interface BidiSpan {
    type: SpanType
    text: string
    ansiPrefix: string
    ansiSuffix: string
}

const PATTERN_NUM = /^[0-9\u0660-\u0669\u06F0-\u06F9]+(?:[.,:\-\/][0-9\u0660-\u0669\u06F0-\u06F9]+)*/
const PATTERN_RTL = /^[\u0590-\u05FF\u0600-\u065F\u0670-\u06EF\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]+/
const PATTERN_LTR_FLAG = /^[\-\/\.\~]+[A-Za-z][A-Za-z0-9_\-\.\/\@\:\#\$\%\&\*\+\=\~\<\>\|\^]*/
const PATTERN_LTR = /^[A-Za-z][A-Za-z0-9_\-\.\/\@\:\#\$\%\&\*\+\=\~\<\>\|\^]*/
const PATTERN_SEP = /^\s+/

/**
 * Splits plain text into granular spans typed as 'rtl', 'ltr', 'num', or 'sep'.
 */
function tokenizeTextIntoSpans (text: string): BidiSpan[] {
    const spans: BidiSpan[] = []
    let i = 0

    while (i < text.length) {
        const remaining = text.slice(i)

        // 1. Whitespace separator
        const sepMatch = PATTERN_SEP.exec(remaining)
        if (sepMatch) {
            spans.push({ type: 'sep', text: sepMatch[0], ansiPrefix: '', ansiSuffix: '' })
            i += sepMatch[0].length
            continue
        }

        // 2. Number sequence
        const numMatch = PATTERN_NUM.exec(remaining)
        if (numMatch) {
            spans.push({ type: 'num', text: numMatch[0], ansiPrefix: '', ansiSuffix: '' })
            i += numMatch[0].length
            continue
        }

        // 3. Persian/Arabic RTL text
        const rtlMatch = PATTERN_RTL.exec(remaining)
        if (rtlMatch) {
            spans.push({ type: 'rtl', text: rtlMatch[0], ansiPrefix: '', ansiSuffix: '' })
            i += rtlMatch[0].length
            continue
        }

        // 4. English CLI flag or path (e.g. --help, /usr/bin)
        const flagMatch = PATTERN_LTR_FLAG.exec(remaining)
        if (flagMatch) {
            spans.push({ type: 'ltr', text: flagMatch[0], ansiPrefix: '', ansiSuffix: '' })
            i += flagMatch[0].length
            continue
        }

        // 5. English word / LTR identifier
        const ltrMatch = PATTERN_LTR.exec(remaining)
        if (ltrMatch) {
            spans.push({ type: 'ltr', text: ltrMatch[0], ansiPrefix: '', ansiSuffix: '' })
            i += ltrMatch[0].length
            continue
        }

        // 6. Neutral symbol or bracket
        const char = remaining[0]
        spans.push({ type: 'sep', text: char, ansiPrefix: '', ansiSuffix: '' })
        i++
    }

    return spans
}

/**
 * Collapses adjacent spans of compatible types (e.g., LTR words separated by spaces,
 * or RTL words separated by spaces), provided there is no ANSI boundary between them.
 */
function collapseCompatibleSpans (spans: BidiSpan[]): BidiSpan[] {
    if (spans.length <= 1) {
        return spans
    }

    const collapsed: BidiSpan[] = []

    for (let i = 0; i < spans.length; i++) {
        const current = spans[i]

        // Check if we can collapse with previous span across a single whitespace separator
        if (
            collapsed.length >= 2 &&
            current.type !== 'sep' &&
            !current.ansiPrefix
        ) {
            const separator = collapsed[collapsed.length - 1]
            const previous = collapsed[collapsed.length - 2]

            if (
                separator.type === 'sep' &&
                /^\s+$/.test(separator.text) &&
                !separator.ansiPrefix &&
                !separator.ansiSuffix &&
                !previous.ansiSuffix &&
                previous.type === current.type
            ) {
                // Merge: previous + separator + current
                previous.text += separator.text + current.text
                previous.ansiSuffix = current.ansiSuffix
                collapsed.pop() // remove separator
                continue
            }
        }

        collapsed.push({ ...current })
    }

    return collapsed
}

/**
 * Determines whether an ANSI sequence is a formatting reset sequence.
 */
function isAnsiReset (code: string): boolean {
    return code === '\x1b[0m' || code === '\x1b[m' || code.includes(';0m')
}

/**
 * Processes a single terminal line with bidirectional reordering and ANSI preservation.
 *
 * @param line Single terminal line without line-break characters.
 * @returns Visually reordered line ready for LTR terminal rendering.
 */
export function processBidiLine (line: string): string {
    if (!line) {
        return ''
    }

    // Fast path: if there are no RTL characters, return line unmodified
    if (!isRTL(line)) {
        return line
    }

    const tokens = tokenizeAnsi(line)
    const rawSpans: BidiSpan[] = []
    let pendingPrefixAnsi = ''

    for (const token of tokens) {
        if (token.type === 'ansi') {
            if (isAnsiReset(token.value) && rawSpans.length > 0) {
                // Attach reset code as suffix to preceding text
                rawSpans[rawSpans.length - 1].ansiSuffix += token.value
            } else {
                pendingPrefixAnsi += token.value
            }
        } else {
            const textSpans = tokenizeTextIntoSpans(token.value)
            if (textSpans.length > 0) {
                if (pendingPrefixAnsi) {
                    textSpans[0].ansiPrefix = pendingPrefixAnsi + textSpans[0].ansiPrefix
                    pendingPrefixAnsi = ''
                }
                rawSpans.push(...textSpans)
            }
        }
    }

    if (rawSpans.length === 0) {
        return line
    }

    // Append any leftover trailing ANSI code
    if (pendingPrefixAnsi) {
        rawSpans[rawSpans.length - 1].ansiSuffix += pendingPrefixAnsi
    }

    const spans = collapseCompatibleSpans(rawSpans)

    // Determine line base direction by finding the first strong directional span
    let baseDirection: 'rtl' | 'ltr' = 'ltr'
    for (const span of spans) {
        if (span.type === 'rtl') {
            baseDirection = 'rtl'
            break
        }
        if (span.type === 'ltr') {
            baseDirection = 'ltr'
            break
        }
    }

    // Render individual spans
    const renderSpan = (span: BidiSpan): string => {
        let content = span.text
        if (span.type === 'rtl') {
            content = reshapePersianAndReverse(span.text)
        }
        return span.ansiPrefix + content + span.ansiSuffix
    }

    if (baseDirection === 'rtl') {
        // In RTL base direction, visually reverse the order of spans on LTR grid
        const reversedSpans = [...spans].reverse()
        return reversedSpans.map(renderSpan).join('')
    }

    // In LTR base direction, preserve LTR spans in order while reversing embedded RTL spans
    let result = ''
    let rtlCluster: BidiSpan[] = []

    const flushRtlCluster = () => {
        if (rtlCluster.length > 0) {
            const reversedCluster = [...rtlCluster].reverse()
            result += reversedCluster.map(renderSpan).join('')
            rtlCluster = []
        }
    }

    for (const span of spans) {
        if (span.type === 'rtl' || (rtlCluster.length > 0 && span.type === 'num')) {
            rtlCluster.push(span)
        } else if (span.type === 'sep' && rtlCluster.length > 0) {
            rtlCluster.push(span)
        } else {
            flushRtlCluster()
            result += renderSpan(span)
        }
    }
    flushRtlCluster()

    return result
}

/**
 * Processes multiline text streams, preserving line delimiters (\r\n or \n) and
 * applying bidirectional reordering to each line independently.
 *
 * @param text Multiline terminal stream string.
 * @returns Reordered multiline string.
 */
export function processBidiText (text: string): string {
    if (!text) {
        return text ?? ''
    }

    const parts = text.split(/(\r?\n)/)
    for (let i = 0; i < parts.length; i += 2) {
        parts[i] = processBidiLine(parts[i])
    }
    return parts.join('')
}
