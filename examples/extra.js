const { Telegraf } = require('telegraf')
const LocalSession = require('../lib/session') // require('telegraf-session-local')

const bot = new Telegraf(process.env.BOT_TOKEN) // Your Bot token here

const localSession = new LocalSession({
  // Database name/path, where sessions will be located (default: 'sessions.json')
  database: 'example_db.json',
  // Name of session property object in Telegraf Context (default: 'session')
  property: 'session',
  // Type of lowdb storage (default: 'storageFileSync')
  storage: LocalSession.storageFileAsync,
  // Format of storage/database (default: JSON.stringify / JSON.parse)
  format: {
    serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
    deserialize: (str) => JSON.parse(str),
  },
  // We will use `messages` array in our database to store user messages using exported lowdb instance from LocalSession via Telegraf Context
  state: { messages: [] }
})

// Wait for database async initialization finished (storageFileAsync or your own asynchronous storage adapter)
localSession.DB.then(DB => {
  // Database now initialized, so now you can retrieve anything you want from it
  console.log('Current LocalSession DB:', DB.value())
  // console.log(DB.get('sessions').getById('1:1').value())
})

// Telegraf will use `telegraf-session-local` configured above middleware
bot.use(localSession.middleware())

bot.on('text', (ctx, next) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  ctx.replyWithMarkdownV2(`Counter updated, new value: \`${ctx.session.counter}\``)
  // Writing message to Array `messages` into database which already has sessions Array
  ctx.sessionDB.get('messages').push([ctx.message]).write()
  // `property`+'DB' is a name of ctx property which contains lowdb instance, default = `sessionDB`

  return next()
})

bot.command('/stats', (ctx) => {
  ctx.replyWithMarkdownV2(`Session has \`${ctx.session.counter}\` messages from @${ctx.from.username || ctx.from.id}`)
})

bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdownV2(`Removing session from lowdb database: \`${JSON.stringify(ctx.session)}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx.session = null
})

bot.launch()
