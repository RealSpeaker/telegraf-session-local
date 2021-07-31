import {Telegraf} from 'telegraf'
import * as should from 'should'
import * as debugPackage from 'debug'

import {LocalSession} from '../source'

const debug = debugPackage('telegraf:session-local:test')

describe('Telegraf Session local : Session Key Update Types', () => {
  const localSession = new LocalSession()

  it('Should handle message', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    bot.on('text', ctx => {
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Session key', sessionKey)
      sessionKey?.should.be.equal('2:1')
      done()
    })
    bot.handleUpdate({message: {chat: {id: 2}, from: {id: 1}, text: 'hey'}} as any)
  })

  it('Should handle inline_query', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    bot.on('inline_query', ctx => {
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Session key', sessionKey)
      should.exist(sessionKey)
      sessionKey?.should.be.equal('1:1')
      done()
    })
    bot.handleUpdate({inline_query: {from: {id: 1}, query: ''}} as any)
  })

  it('Should handle callback_query from chat', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    bot.action('c:b', ctx => {
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Session key', sessionKey)
      should.exist(sessionKey)
      sessionKey?.should.be.equal('2:1')
      done()
    })
    bot.handleUpdate({callback_query: {from: {id: 1}, message: {from: {id: 3}, chat: {id: 2}, text: 'hey'}, chat_instance: '-123', data: 'c:b'}} as any)
  })

  it('Should handle callback_query from inline_query message', done => {
    const bot = new Telegraf('123:ABC');
    (bot as any).botInfo = {}
    bot.action('c:b', ctx => {
      const sessionKey = localSession.getSessionKey(ctx)
      debug('Session key', sessionKey)
      should.exist(sessionKey)
      sessionKey?.should.be.equal('-123:1')
      done()
    })
    bot.handleUpdate({callback_query: {from: {id: 1}, inline_message_id: 'BAA', chat_instance: '-123', data: 'c:b'}} as any)
  })
})
