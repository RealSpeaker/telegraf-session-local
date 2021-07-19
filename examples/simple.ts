import {Telegraf, Context as TelegrafContext} from 'telegraf'
import {LocalSession} from '../source' // from 'telegraf-session-local'

interface Session {
  counter?: number;
}

interface MyContext extends TelegrafContext {
  session: Session;
}

const bot = new Telegraf<MyContext>(process.env['BOT_TOKEN']!) // Your Bot token here

bot.use((new LocalSession({database: 'example_db.json'})).middleware())

bot.on('text', async (ctx, next) => {
  ctx.session.counter = ctx.session.counter ?? 0
  ctx.session.counter++
  await ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``)
  return next()
})

bot.command('/stats', async (ctx) => {
  await ctx.replyWithMarkdown(`Database has \`${String(ctx.session.counter)}\` messages from @${ctx.from.username ?? ctx.from.id}`)
})

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bot.launch()
