const
  Telegraf = require('telegraf'),
  LocalSession = require('../lib/session') // require('telegraf-session-local')

const Bot = new Telegraf(process.env.BOT_TOKEN)

Bot.use((new LocalSession({ database: 'example_db.json' })).middleware())

Bot.on('text', (ctx, next) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  return next()
})

Bot.command('/stats', (ctx) => {
  ctx.replyWithMarkdown(`Database has \`${ctx.session.counter}\` messages from @${ctx.from.username}`)
})

Bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.session)}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx.session = null
})

Bot.startPolling()
