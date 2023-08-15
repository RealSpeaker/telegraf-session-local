/* eslint object-curly-spacing: ["error", "always"] */
const
  { Telegraf } = require('telegraf'),
  should = require('should'),
  debug = require('debug')('telegraf:session-local:test'),
  LocalSession = require('../lib/session'),
  options = { storage: LocalSession.storageMemory }

describe('Telegraf Session local : General', () => {
  let bot = {}
  const localSession = new LocalSession(options)

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

  it('Should use custom `format.serialize` and `format.deserialize` functions', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    const session = new LocalSession({
      database: 'test_sync_db.json',
      storage: LocalSession.storageFileSync,
      format: {
        // By default lowdb uses pretty-printed JSON string: JSON.stringify(obj, null, 2)
        // We will override that behaviour calling it `oneline`, making one-lined JSON string
        serialize: function oneline(obj) {
          return JSON.stringify(obj)
        },
        deserialize: JSON.parse,
      },
    })
    bot.on('text', session.middleware(), (ctx) => {
      should.exist(ctx.session)
      ctx.session.wow = true
      // ctx.session.should.have.property('wow')
      // ctx.session.foo.should.be.equal(true)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('Should have access to lowdb instance via ctx.sessionDB', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('lowdb instance via `ctx.sessionDB` %o', ctx.sessionDB)
      should.exist(ctx.sessionDB)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
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

  it('Should have access to lowdb instance via overrided property in ctx', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware('data'), (ctx) => {
      debug('lowdb instance via `ctx.dataDB` %o', ctx.dataDB)
      should.exist(ctx.dataDB)
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
      should.not.exists(await localSession.saveSession(undefined, { authenticated: false }))
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('Should detect if object is Promise/like or not', (done) => {
    const isPromise = require('../lib/session').isPromise

    const notPromise = () => null
    const promise = () => new Promise(resolve => resolve(null))
    const promiseLike = () => ({ then: cb => cb(null) })

    isPromise(undefined).should.be.equal(false)
    isPromise(true).should.be.equal(false)
    isPromise(notPromise()).should.be.equal(false)
    isPromise(promise()).should.be.equal(true)
    isPromise(promiseLike()).should.be.equal(true)

    done()
  })
})
