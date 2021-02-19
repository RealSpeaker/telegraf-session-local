const { Telegraf } = require('telegraf')
const { LocalSession } = require('../dist') // require('telegraf-session-local')

const bot = new Telegraf(process.env.BOT_TOKEN) // Your Bot token here

bot.use((new LocalSession({ database: 'example_db.json' })).middleware())

bot.on('text', (ctx, next) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``)
  return next()
})

bot.command('/stats', (ctx) => {
  ctx.replyWithMarkdown(`Database has \`${ctx.session.counter}\` messages from @${ctx.from.username || ctx.from.id}`)
})

bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.session)}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx.session = null
})

bot.launch()
