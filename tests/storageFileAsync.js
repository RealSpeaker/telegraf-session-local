/* eslint object-curly-spacing: ["error", "always"] */
const
  Telegraf = require('telegraf'),
  LocalSession = require('../lib/session'),
  should = require('should'),
  debug = require('debug')('telegraf:session-local:test'),
  options = { database: 'test_async_db.json', storage: LocalSession.storagefileAsync }

describe('Telegraf Session local : storagefileAsync', () => {
  let bot = {}
  let localSession = new LocalSession(options)

  it('storagefileAsync: Should retrieve and save session', (done) => {
    const key = '1:1' // ChatID:FromID
    let session = localSession.getSession(key)
    debug('getSession %O', session)
    should.exist(session)
    session.foo = 42
    localSession.saveSession(key, session).then(_session => {
      debug('Saved session %O', _session)
      should.exist(_session)
      _session.data.should.be.deepEqual({ foo: 42 })
      done()
    })
  })

  it('storagefileAsync: Should has session', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Middleware session %O', ctx.session)
      should.exist(ctx.session)
      ctx.session.foo = 42
      debug('Updated Middleware session %O', ctx.session)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('storagefileAsync: Should handle existing session', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Existing Middleware session %O', ctx.session)
      should.exist(ctx.session)
      ctx.session.should.have.property('foo')
      ctx.session.foo.should.be.equal(42)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('storagefileAsync: Should handle not existing session', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Not Existing Middleware session %O', ctx.session)
      should.exist(ctx.session)
      ctx.session.should.not.have.property('foo')
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1337 }, from: { id: 1337 }, text: 'hey' } })
  })

  it('storagefileAsync: Should handle session reset', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Middleware session reset - before %O', ctx.session)
      ctx.session = null
      should.exist(ctx.session)
      ctx.session.should.not.have.property('foo')
      debug('Middleware session reset - after %O', ctx.session)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })
})
