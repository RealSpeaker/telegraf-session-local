import {Bot} from 'grammy'
import * as should from 'should'

import {LocalSession} from '../source'

describe('Telegraf Session local : grammY', () => {
  it('works with grammY', done => {
    const bot = new Bot('123:ABC');
    (bot as any).botInfo = {}
    const session = new LocalSession()
    bot.use(session.middleware(), (ctx: any) => {
      should.exist(ctx.session)
      done()
    })
    bot.handleUpdate({message: {chat: {id: 1}, from: {id: 1}, text: 'hey'}} as any)
  })
})
