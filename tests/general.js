/* eslint object-curly-spacing: ["error", "always"] */
const
  Telegraf = require('telegraf'),
  LocalSession = require('../lib/session'),
  should = require('should'),
  debug = require('debug')('telegraf:session-local:test'),
  options = { storage: LocalSession.storageMemory }

describe('Telegraf Session local : General', () => {
  let bot = {}
  let localSession = new LocalSession(options)

  it('Should have access to lowdb instance via ctx.sessionDB', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware(), (ctx) => {
      debug('lowdb instance via `ctx.sessionDB` %o', ctx.sessionDB)
      should.exist(ctx.sessionDB)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('Should override default `session` property to `data` at middleware() call', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware('data'), (ctx) => {
      debug('Overrided session property %o', ctx.data)
      should.exist(ctx.data)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })

  it('Should have access to lowdb instance via overrided property in ctx', (done) => {
    bot = new Telegraf()
    bot.on('text', localSession.middleware('data'), (ctx) => {
      debug('lowdb instance via `ctx.dataDB` %o', ctx.dataDB)
      should.exist(ctx.dataDB)
      done()
    })
    bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
  })
})
