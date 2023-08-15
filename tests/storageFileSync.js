/* eslint object-curly-spacing: ["error", "always"] */
const
  { Telegraf } = require('telegraf'),
  should = require('should'),
  debug = require('debug')('telegraf:session-local:test'),
  LocalSession = require('../lib/session'),
  options = { database: 'test_sync_db.json', storage: LocalSession.storageFileSync }

let bot = {}
const localSession = new LocalSession(options)

describe('Telegraf Session local : storageFileSync', () => {

  it('storageFileSync: Should retrieve and save session', (done) => {
    const key = '1:1' // ChatID:FromID
    const session = localSession.getSession(key)
    debug('getSession %O', session)
    should.exist(session)
    session.foo = 42
    localSession.saveSession(key, session).then((_session) => {
      debug('Saved session %O', _session)
      should.exist(_session)
      _session.data.should.be.deepEqual({ foo: 42 })
      done()
    })
  })

  it('storageFileSync: Should has session', (done) => {
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

  it('storageFileSync: Should handle existing session', (done) => {
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

  it('storageFileSync: Should handle not existing session', (done) => {
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

  it('storageFileSync: Should handle session reset', (done) => {
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

  it('storageFileSync: Should work properly with deprecated stoarge name - storagefileSync', (done) => {
    const _options = Object.assign({ storage: LocalSession.storagefileSync }, options)
    const _localSession = new LocalSession(_options)
    const key = '1:1' // ChatID:FromID
    const session = _localSession.getSession(key)
    debug('getSession %O', session)
    should.exist(session)
    session.foo = 42
    _localSession.saveSession(key, session).then((_session) => {
      debug('Saved session %O', _session)
      should.exist(_session)
      _session.data.should.be.deepEqual({ foo: 42 })
      done()
    })
  })
})
