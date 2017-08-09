const
  Telegraf = require('telegraf'),
  LocalSession = require('../lib/session')

const Bot = new Telegraf(process.env.BOT_TOKEN)

// Name of session property object in Telegraf Context (default: 'session')
const property = 'data'

const localSession = new LocalSession({
  // Database name/path, where sessions will be located (default: 'sessions.json')
  database: 'example_db.json',
  // Name of session property object in Telegraf Context (default: 'session')
  property: 'session',
  // Type of lowdb storage (default: 'storagefileAsync')
  storage: LocalSession.storagefileAsync,
  // Format of storage/database (default: JSON.stringify / JSON.parse)
  format: {
    serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
    deserialize: (str) => JSON.parse(str),
  },
  // We will use `messages` array in our database to store user messages using exported lowdb instance from LocalSession via Telegraf Context
  state: { messages: [] }
})

// Telegraf will use `telegraf-session-local` configured above middleware with overrided `property` name
Bot.use(localSession.middleware(property))

Bot.on('text', (ctx, next) => {
  ctx[property].counter = ctx[property].counter || 0
  ctx[property].counter++
  // Writing message to Array `messages` into database which already has sessions Array
  ctx[property + 'DB'].get('messages').push([ctx.message]).write()
  // `property`+'DB' is a name of property which contains lowdb instance (`dataDB`)

  return next()
})

Bot.command('/stats', (ctx) => {
  let msg = `Using session object from [Telegraf Context](http://telegraf.js.org/context.html) (\`ctx\`), named \`${property}\`\n`
  msg += `Database has \`${ctx[property].counter}\` messages from @${ctx.from.username}`
  ctx.replyWithMarkdown(msg)
})
Bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx[property])}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx[property] = null
})

Bot.startPolling()
