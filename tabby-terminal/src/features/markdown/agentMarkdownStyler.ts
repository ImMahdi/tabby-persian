/**
 * Agent Markdown Stream Styler
 *
 * Formats streaming Markdown output from AI CLI agents (Claude Code, agy, codex, opencode)
 * into terminal-friendly ANSI sequences with Unicode Box-Drawing codeblock borders, styled
 * headings, blockquote indicators, and inline styling.
 *
 * Includes an alternate screen buffer guard to bypass formatting during full-screen TUI apps
 * (vim, nano, htop, etc.).
 */

export class AgentMarkdownStyler {
    private inCodeBlock = false
    private codeBlockLang = ''
    private inAlternateScreen = false
    private lineBuffer = ''

    /**
     * Checks whether terminal is currently in alternate screen buffer mode.
     */
    isAlternateScreen(): boolean {
        return this.inAlternateScreen
    }

    /**
     * Returns current code block language if inside a code block.
     */
    getCodeBlockLang(): string {
        return this.codeBlockLang
    }

    /**
     * Inspects terminal escape sequences to detect alternate screen buffer transitions.
     * Handles standard xterm 1049, 1047, and 47 sequences.
     */
    handleTerminalSequence(data: string): void {
        const regex = /\x1b\[\?(?:1049|1047|47)([hl])/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(data)) !== null) {
            this.inAlternateScreen = match[1] === 'h'
        }
    }

    /**
     * Formats a single line of Markdown text into ANSI escape sequences.
     * When alternate screen is active, passes the line through unmodified.
     */
    processLine(line: string): string {
        if (this.inAlternateScreen) {
            return line
        }

        // Check for fenced code block delimiters (```[lang])
        const fenceMatch = line.match(/^\s{0,3}```\s*([^\s`]+)?\s*$/)
        if (fenceMatch) {
            if (!this.inCodeBlock) {
                // Opening fence
                this.inCodeBlock = true
                const lang = fenceMatch[1] || ''
                this.codeBlockLang = lang

                if (lang) {
                    const dashesCount = Math.max(2, 44 - lang.length)
                    const dashes = '─'.repeat(dashesCount)
                    return `\x1b[38;5;244m┌─ [\x1b[38;5;220m${lang}\x1b[38;5;244m] ${dashes}┐\x1b[0m`
                }
                return `\x1b[38;5;244m┌${'─'.repeat(49)}┐\x1b[0m`
            }

            // Closing fence
            this.inCodeBlock = false
            this.codeBlockLang = ''
            return `\x1b[38;5;244m└${'─'.repeat(49)}┘\x1b[0m`
        }

        // If inside a code block, prefix line with vertical border and bypass other formatting
        if (this.inCodeBlock) {
            if (line.length > 0) {
                return `\x1b[38;5;244m│ \x1b[0m${line}`
            }
            return '\x1b[38;5;244m│\x1b[0m'
        }

        // Headings: # (h1), ## (h2), ### (h3), ####+ (h4+)
        const h3Match = line.match(/^###\s+(.*)$/)
        if (h3Match) {
            return `\x1b[1;33m● ${h3Match[1]}\x1b[0m`
        }

        const h2Match = line.match(/^##\s+(.*)$/)
        if (h2Match) {
            return `\x1b[1;35m▸ ${h2Match[1]}\x1b[0m`
        }

        const h1Match = line.match(/^#\s+(.*)$/)
        if (h1Match) {
            return `\x1b[1;36m◆ ${h1Match[1]}\x1b[0m`
        }

        const h4Match = line.match(/^####+\s+(.*)$/)
        if (h4Match) {
            return `\x1b[1;34m○ ${h4Match[1]}\x1b[0m`
        }

        // Horizontal rules: ---, ***, ___
        if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            return `\x1b[38;5;240m${'─'.repeat(50)}\x1b[0m`
        }

        // Blockquote: > quote
        const quoteMatch = line.match(/^>\s?(.*)$/)
        if (quoteMatch) {
            const quoteContent = quoteMatch[1]
            if (quoteContent) {
                return `\x1b[38;5;39m│\x1b[0m \x1b[3m${this.processInline(quoteContent)}\x1b[23m`
            }
            return '\x1b[38;5;39m│\x1b[0m'
        }

        // Bullet lists: - item, * item
        const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/)
        if (listMatch) {
            const indent = listMatch[1]
            const content = listMatch[3]
            return `${indent}  \x1b[38;5;245m•\x1b[0m ${this.processInline(content)}`
        }

        // Regular line with inline formatting
        return this.processInline(line)
    }

    /**
     * Processes inline Markdown elements: inline code, bold, italic.
     */
    private processInline(text: string): string {
        // Protect inline code from nested formatting
        const inlineCodes: string[] = []
        let result = text.replace(/`([^`]+)`/g, (_, code) => {
            const idx = inlineCodes.length
            inlineCodes.push(`\x1b[48;5;236m\x1b[38;5;223m ${code} \x1b[0m`)
            return `\x00INLINE_CODE_${idx}\x00`
        })

        // Bold + Italic: ***text***
        result = result.replace(/\*\*\*(.+?)\*\*\*/g, '\x1b[1;3m$1\x1b[22;23m')

        // Bold: **text**
        result = result.replace(/\*\*(.+?)\*\*/g, '\x1b[1m$1\x1b[22m')

        // Italic: *text* (avoiding matching ** parts)
        result = result.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '\x1b[3m$1\x1b[23m')

        // Restore inline code blocks
        result = result.replace(/\x00INLINE_CODE_(\d+)\x00/g, (_, idx) => inlineCodes[Number(idx)])

        return result
    }

    /**
     * Processes streaming chunks of text, buffering incomplete lines until a newline.
     * Also detects embedded terminal alternate screen buffer escape sequences.
     */
    processChunk(chunk: string): string {
        // Split chunk by alternate screen sequence transitions
        const parts = chunk.split(/(\x1b\[\?(?:1049|1047|47)[hl])/g)
        let output = ''

        for (const part of parts) {
            if (!part) {
                continue
            }

            const altMatch = part.match(/^\x1b\[\?(?:1049|1047|47)([hl])$/)
            if (altMatch) {
                this.inAlternateScreen = altMatch[1] === 'h'
                output += part
                continue
            }

            if (this.inAlternateScreen) {
                // If switching to alternate screen with pending line buffer, flush buffer untouched
                if (this.lineBuffer) {
                    output += this.lineBuffer
                    this.lineBuffer = ''
                }
                output += part
            } else {
                output += this.processBufferedText(part)
            }
        }

        return output
    }

    /**
     * Buffers and processes complete lines within normal screen mode.
     */
    private processBufferedText(text: string): string {
        const fullData = this.lineBuffer + text
        let lastIndex = 0
        let match: RegExpExecArray | null
        const regex = /([^\r\n]*)(\r?\n)/g
        let result = ''

        while ((match = regex.exec(fullData)) !== null) {
            const lineContent = match[1]
            const lineEnding = match[2]
            result += this.processLine(lineContent) + lineEnding
            lastIndex = regex.lastIndex
        }

        this.lineBuffer = fullData.slice(lastIndex)
        return result
    }

    /**
     * Flushes any remaining un-terminated line content in the buffer.
     */
    flush(): string {
        if (this.lineBuffer.length === 0) {
            return ''
        }
        const remaining = this.lineBuffer
        this.lineBuffer = ''
        if (this.inAlternateScreen) {
            return remaining
        }
        return this.processLine(remaining)
    }

    /**
     * Resets state machine (code block state, line buffer, alternate screen flag).
     */
    reset(): void {
        this.lineBuffer = ''
        this.inCodeBlock = false
        this.codeBlockLang = ''
        this.inAlternateScreen = false
    }
}
