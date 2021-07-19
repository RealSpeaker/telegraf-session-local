import {Telegraf, Context as TelegrafContext} from 'telegraf'
import {LocalSession} from '../source' // 'telegraf-session-local'

interface Session {
  counter?: number;
}

interface MyContext extends TelegrafContext {
  data: Session;
}

const bot = new Telegraf<MyContext>(process.env['BOT_TOKEN']!) // Your Bot token here

const localSession = new LocalSession<MyContext, Session>({
  // Database name/path, where sessions will be located (default: 'sessions.json')
  database: 'example_db.json',
  // Name of session property object in Telegraf Context (default: 'session')
  property: 'data',
})

// Telegraf will use `telegraf-session-local` configured above middleware with overrided `property` value: `data`, instead of `session`
bot.use(localSession.middleware())

bot.on('text', async (ctx, next) => {
  ctx.data.counter = ctx.data.counter ?? 0
  ctx.data.counter++
  await ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.data.counter}\``)
  return next()
})

bot.command('/stats', async ctx => {
  let message = 'Using session object from [Telegraf Context](http://telegraf.js.org/context.html) (`ctx`), named `data`\n'
  message += `Database has \`${String(ctx.data.counter)}\` messages from @${ctx.from.username ?? ctx.from.id}`
  await ctx.replyWithMarkdown(message)
})
bot.command('/remove', async ctx => {
  await ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.data)}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  // @ts-expect-error
  ctx.data = null
})

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bot.launch()
