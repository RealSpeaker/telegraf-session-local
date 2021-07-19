/* eslint object-curly-spacing: ["error", "always"] */
const
  { Telegraf } = require('telegraf'),
  { LocalSession } = require('../dist'),
  should = require('should'),
  debug = require('debug')('telegraf:session-local:test'),
  options = { database: 'test_async_db.json' }

let bot = {}
const localSession = new LocalSession(options)

describe('Telegraf Session local : storageFileAsync', () => {

  it('storageFileAsync: Should retrieve and save session', async () => {
    const key = '1:1' // ChatID:FromID
    const session = localSession.getSession(key)
    debug('getSession %O', session)
    should.exist(session)
    session.foo = 42
    await localSession.saveSession(key, session)
  })

  it('storageFileAsync: Should has session', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Middleware session %O', ctx.session)
      should.exist(ctx.session)
      ctx.session.foo = 42
      debug('Updated Middleware session %O', ctx.session)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('storageFileAsync: Should handle existing session', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Existing Middleware session %O', ctx.session)
      should.exist(ctx.session)
      ctx.session.should.have.property('foo')
      ctx.session.foo.should.be.equal(42)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('storageFileAsync: Should handle not existing session', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('Not Existing Middleware session %O', ctx.session)
      should.exist(ctx.session)
      ctx.session.should.not.have.property('foo')
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1337 }, from: { id: 1337 }, text: 'hey' } })
  })

  it('storageFileAsync: Should handle session reset', (done) => {
    bot = new Telegraf()
    bot.botInfo = {}
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
