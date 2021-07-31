import {Telegraf} from 'telegraf'
import * as should from 'should'
import * as debugPackage from 'debug'

import {LocalSession} from '../source'

const debug = debugPackage('telegraf:session-local:test')

describe('Telegraf Session local : General', () => {
  const localSession = new LocalSession()

  it('Should works without specifying any options for LocalSession', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    const session = new LocalSession()
    bot.on('text', session.middleware(), (ctx: any) => {
      should.exist(ctx.session)
      done()
    })
    // Temporary using setTimeout() because `telegraf-local-session` doesn't handle async adapters correctly yet
    setTimeout(() => {
      bot.handleUpdate({message: {chat: {id: 1}, from: {id: 1}, text: 'hey'}} as any)
    }, 25)
  })

  it('Should return `undefined` when context has no `from` field', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    bot.on('text', localSession.middleware(), ctx => {
      debug('Telegraf context `from` field: %o', ctx.from)
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Real session key calculated by LocalSession: %o', sessionKey)
      should.not.exists(sessionKey)
      done()
    })
    bot.handleUpdate({message: {chat: {id: 1}, text: 'hey'}} as any)
  })

  it('Should throw when no key provided for session to be saved', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    bot.on('text', localSession.middleware(), async ctx => {
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Real session key calculated by LocalSession: %s', sessionKey)

      try {
        // @ts-expect-error
        await localSession.saveSession(undefined, {authenticated: false})
      } catch {
        done()
      }
    })
    bot.handleUpdate({message: {chat: {id: 1}, from: {id: 1}, text: 'hey'}} as any)
  })
})
