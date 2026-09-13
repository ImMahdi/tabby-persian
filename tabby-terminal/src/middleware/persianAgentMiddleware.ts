import { SessionMiddleware } from '../api/middleware'
import { AgentMarkdownStyler } from '../features/markdown/agentMarkdownStyler'
import { processBidiText } from '../features/persian/persianBidi'

export interface PersianAgentOptions {
    enablePersianBidi?: boolean
    enableAgentMarkdown?: boolean
}

/**
 * PersianAgentMiddleware
 *
 * Session middleware integrating:
 * 1. Agent Markdown Stream Styler (formatting CLI agent output with Unicode Box-Drawing and ANSI styles)
 * 2. Persian Bidirectional (BiDi) Visual Reordering Engine (contextual shaping and RTL line reordering)
 */
export class PersianAgentMiddleware extends SessionMiddleware {
    private options: PersianAgentOptions
    private markdownStyler = new AgentMarkdownStyler()

    constructor (options: PersianAgentOptions = {}) {
        super()
        this.options = {
            enablePersianBidi: false,
            enableAgentMarkdown: false,
            ...options,
        }
    }

    feedFromSession (data: Buffer): void {
        if (!this.options.enablePersianBidi && !this.options.enableAgentMarkdown) {
            this.outputToTerminal.next(data)
            return
        }

        let text = data.toString('utf-8')

        if (this.options.enableAgentMarkdown) {
            text = this.markdownStyler.processChunk(text)
        }

        if (this.options.enablePersianBidi) {
            text = processBidiText(text)
        }

        if (text.length > 0 || data.length === 0) {
            this.outputToTerminal.next(Buffer.from(text, 'utf-8'))
        }
    }

    feedFromTerminal (data: Buffer): void {
        this.outputToSession.next(data)
    }

    close (): void {
        if (this.options.enableAgentMarkdown) {
            const flushed = this.markdownStyler.flush()
            if (flushed) {
                const text = this.options.enablePersianBidi ? processBidiText(flushed) : flushed
                this.outputToTerminal.next(Buffer.from(text, 'utf-8'))
            }
        }
        super.close()
    }
}
