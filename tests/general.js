/* eslint object-curly-spacing: ["error", "always"] */
const
  { Telegraf } = require('telegraf'),
  { LocalSession } = require('../dist'),
  should = require('should'),
  debug = require('debug')('telegraf:session-local:test')

describe('Telegraf Session local : General', () => {
  let bot = {}
  const localSession = new LocalSession()

  it('Should works without specifying any options for LocalSession', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    const session = new LocalSession()
    bot.on('text', session.middleware(), (ctx) => {
      should.exist(ctx.session)
      done()
    })
    // Temporary using setTimeout() because `telegraf-local-session` doesn't handle async adapters correctly yet
    setTimeout(() => {
      bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
    }, 25)
  })

  it('Should override default `session` property to `data` at middleware() call', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware('data'), (ctx) => {
      debug('Overrided session property %o', ctx.data)
      should.exist(ctx.data)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('Should return `undefined` when context has no `from` field', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Telegraf context `from` field: %o', ctx.from)
      should.not.exists(localSession.getSessionKey(ctx))
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, text: 'hey' } })
  })

  it('Should return `undefined` when no key provided for session to be saved', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware(), async (ctx) => {
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Real session key calculated by LocalSession: %s', sessionKey)
      await localSession.saveSession(undefined, { authenticated: false })
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('Should detect if object is Promise/like or not', (done) => {
    const isPromise = require('is-promise')
    function notPromise () { return null }
    function promise () { return new Promise((resolve, reject) => resolve(null)) }
    function promiseLike () { return { then: cb => cb(null) } }
    isPromise(undefined).should.be.equal(false)
    isPromise(true).should.be.equal(false)
    isPromise(notPromise()).should.be.equal(false)
    isPromise(promise()).should.be.equal(true)
    isPromise(promiseLike()).should.be.equal(true)
    done()
  })
})
