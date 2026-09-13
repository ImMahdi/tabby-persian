/**
 * ANSI Escape Sequence Preserver and Tokenizer
 *
 * Provides tokenization and higher-order text processing for terminal streams
 * containing ANSI escape sequences (SGR colors, cursor movements, OSC, private modes),
 * ensuring terminal formatting codes are preserved intact during text transformations
 * (e.g., Persian reshaping, BiDi reordering).
 */

export interface AnsiToken {
    type: 'ansi' | 'text'
    value: string
}

/**
 * Regular expression pattern matching ANSI escape sequences:
 * - CSI (Control Sequence Introducer): \x1b[ ... [@-~]
 * - OSC (Operating System Command): \x1b] ... (\x07|\x1b\)
 * - DCS / APC / PM / SOS: \x1b[P_^X] ... (\x07|\x1b\)
 * - Charset selection: \x1b[()#%*+][@-~]
 * - 2-byte escape sequences: \x1b[@-Z\\-_0-9=><~]
 */
const ANSI_PATTERN = [
    // CSI (Control Sequence Introducer) e.g. \x1b[32m, \x1b[1;31m, \x1b[2K, \x1b[?25h
    '(?:\\x1b\\[|\\u009b)[0-9:;<=>?]*[\\x20-\\x2f]*[@-~]',
    // OSC (Operating System Command) e.g. \x1b]0;Title\x07, \x1b]8;;url\x1b\
    '(?:\\x1b\\]|\\u009d)[^\\x07\\x1b]*(?:\\x07|\\x1b\\\\|\\u009c)',
    // DCS, APC, PM, SOS
    '(?:\\x1b[P_^X]|\\u0090|\\u009f|\\u009e|\\u0098)[^\\x07\\x1b]*(?:\\x07|\\x1b\\\\|\\u009c)',
    // Charset designation (e.g. \x1b(B)
    '\\x1b[()#%*+][@-~]',
    // 2-byte escape sequences (e.g. \x1b7, \x1b8, \x1b=, \x1b>, \x1bM)
    '\\x1b[@-Z\\\\-_0-9=><~]',
].join('|')

/**
 * Creates a fresh RegExp instance matching ANSI escape sequences with global flag.
 */
export function createAnsiRegex (): RegExp {
    return new RegExp(ANSI_PATTERN, 'g')
}

/**
 * Tokenizes a string into an ordered array of ANSI escape sequences and text chunks.
 *
 * @param input The input string containing text and/or ANSI escape sequences.
 * @returns Array of AnsiToken objects preserving original sequence and order.
 */
export function tokenizeAnsi (input: string): AnsiToken[] {
    if (!input) {
        return []
    }

    const tokens: AnsiToken[] = []
    const regex = createAnsiRegex()
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(input)) !== null) {
        const ansiStart = match.index
        const ansiValue = match[0]

        if (ansiStart > lastIndex) {
            tokens.push({
                type: 'text',
                value: input.slice(lastIndex, ansiStart),
            })
        }

        tokens.push({
            type: 'ansi',
            value: ansiValue,
        })

        lastIndex = ansiStart + ansiValue.length
    }

    if (lastIndex < input.length) {
        tokens.push({
            type: 'text',
            value: input.slice(lastIndex),
        })
    }

    return tokens
}

/**
 * Higher-order function that applies a text processor exclusively to text tokens
 * while leaving ANSI escape sequences untouched in their original positions and order.
 *
 * @param input The input string with optional ANSI sequences.
 * @param textProcessor Transformation callback applied to text portions only.
 * @returns Transformed string with ANSI sequences intact.
 */
export function processWithAnsi (input: string, textProcessor: (text: string) => string): string {
    if (!input) {
        return ''
    }

    const tokens = tokenizeAnsi(input)
    let result = ''
    for (const token of tokens) {
        if (token.type === 'text') {
            result += textProcessor(token.value)
        } else {
            result += token.value
        }
    }
    return result
}

/**
 * Strips all ANSI escape sequences from an input string, returning only plain text.
 *
 * @param input String potentially containing ANSI escape codes.
 * @returns Plain text with all escape sequences removed.
 */
export function stripAnsi (input: string): string {
    if (!input) {
        return ''
    }
    return input.replace(createAnsiRegex(), '')
}

/**
 * Checks whether an input string contains any ANSI escape sequences.
 *
 * @param input String to check.
 * @returns True if at least one ANSI escape sequence is present, false otherwise.
 */
export function hasAnsi (input: string): boolean {
    if (!input) {
        return false
    }
    return createAnsiRegex().test(input)
}
