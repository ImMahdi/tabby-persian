import test from 'node:test'
import assert from 'node:assert/strict'
import { SessionMiddlewareStack } from '../api/middleware'
import { PersianAgentMiddleware } from './persianAgentMiddleware'

test('PersianAgentMiddleware processes output stream with Markdown and BiDi', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: true, enableAgentMarkdown: true })
    let received = ''
    middleware.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    middleware.feedFromSession(Buffer.from('# گزارش سیستم\n'))
    assert.ok(received.length > 0)
    assert.match(received, /◆/)
})

test('PersianAgentMiddleware passes data directly when features are disabled', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: false, enableAgentMarkdown: false })
    let received = ''
    middleware.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    const input = '# Raw text\n'
    middleware.feedFromSession(Buffer.from(input))
    assert.strictEqual(received, input)
})

test('PersianAgentMiddleware forwards terminal input directly to session unaltered', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: true, enableAgentMarkdown: true })
    let received = ''
    middleware.outputToSession$.subscribe(buf => {
        received += buf.toString()
    })

    const input = 'ls -la /home/user\r\n'
    middleware.feedFromTerminal(Buffer.from(input))
    assert.strictEqual(received, input)
})

test('PersianAgentMiddleware handles Persian BiDi alone when Markdown is disabled', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: true, enableAgentMarkdown: false })
    let received = ''
    middleware.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    const input = 'سلام دنیا\n'
    middleware.feedFromSession(Buffer.from(input))
    assert.ok(received.length > 0)
    assert.notStrictEqual(received, input)
    assert.doesNotMatch(received, /◆/)
})

test('PersianAgentMiddleware handles Markdown alone when BiDi is disabled', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: false, enableAgentMarkdown: true })
    let received = ''
    middleware.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    middleware.feedFromSession(Buffer.from('# System Report\n'))
    assert.match(received, /◆ System Report/)
})

test('PersianAgentMiddleware flushes un-terminated buffer on close', async () => {
    const middleware = new PersianAgentMiddleware({ enablePersianBidi: false, enableAgentMarkdown: true })
    let received = ''
    middleware.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    middleware.feedFromSession(Buffer.from('**bold**'))
    assert.strictEqual(received, '') // buffered because no newline
    middleware.close()
    assert.match(received, /\x1b\[1mbold\x1b\[22m/)
})

test('SessionMiddlewareStack integrates PersianAgentMiddleware dynamically', () => {
    const stack = new SessionMiddlewareStack()
    let received = ''
    stack.outputToTerminal$.subscribe(buf => {
        received += buf.toString()
    })

    const initialMiddleware = new PersianAgentMiddleware({ enablePersianBidi: false, enableAgentMarkdown: false })
    stack.push(initialMiddleware)
    stack.feedFromSession(Buffer.from('# Raw\n'))
    assert.strictEqual(received, '# Raw\n')

    received = ''
    const updatedMiddleware = new PersianAgentMiddleware({ enablePersianBidi: true, enableAgentMarkdown: true })
    stack.replace(initialMiddleware, updatedMiddleware)
    stack.feedFromSession(Buffer.from('# گزارش سیستم\n'))
    assert.ok(received.length > 0)
    assert.match(received, /◆/)
})
