# [Telegraf](https://github.com/telegraf/telegraf) Session local

[![NPM Version](https://img.shields.io/npm/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![node](https://img.shields.io/node/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![npm](https://img.shields.io/npm/dm/telegraf-session-local.svg?style=flat-square)](https://npmcharts.com/compare/telegraf-session-local,telegraf-session-redis,telegraf-session-mysql,telegraf-session-mongo,telegraf-session-dynamodb?interval=30)
[![Travis (.org) branch](https://img.shields.io/travis/RealSpeaker/telegraf-session-local/master.svg?style=flat-square)](https://travis-ci.org/RealSpeaker/telegraf-session-local)
[![Coveralls github branch](https://img.shields.io/coveralls/github/RealSpeaker/telegraf-session-local/master.svg?style=flat-square)](https://coveralls.io/github/RealSpeaker/telegraf-session-local?branch=master)
[![Codacy branch grade](https://img.shields.io/codacy/grade/761ed505ba2d44bd9a2bc598e68969e3/master.svg?style=flat-square)](https://app.codacy.com/project/RealSpeaker/telegraf-session-local/dashboard)
[![David](https://img.shields.io/david/RealSpeaker/telegraf-session-local.svg?style=flat-square)](https://david-dm.org/RealSpeaker/telegraf-session-local)

> Middleware for locally stored sessions & database

### ⚡️ Features

- Any type of storage: `Memory`, `FileSync`, `FileAsync`, ... (implement your own)
- Any format you want: `JSON`, `BSON`, `YAML`, `XML`, ... (implement your own)
- Shipped together with power of `lodash`
- Supports basic DB-like operations (thanks to [lodash-id](https://github.com/typicode/lodash-id)):

  `getById`, `insert`, `upsert`, `updateById`, `updateWhere`, `replaceById`, `removeById`, `removeWhere`, `createId`,

## 🚀 Installation

```js
$ npm install telegraf-session-local -S
```

### [Documentation & API](http://realspeaker.github.io/telegraf-session-local/)

## 👀 Quick-start example

```js
const
  Telegraf = require('telegraf'),
  LocalSession = require('telegraf-session-local')

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

bot.startPolling()
```

## 💡 Full example

```js
const
  Telegraf = require('telegraf'),
  LocalSession = require('telegraf-session-local')

const bot = new Telegraf(process.env.BOT_TOKEN) // Your Bot token here

// Name of session property object in Telegraf Context (default: 'session')
const property = 'data'

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

// Telegraf will use `telegraf-session-local` configured above middleware with overrided `property` name
bot.use(localSession.middleware(property))

bot.on('text', (ctx, next) => {
  ctx[property].counter = ctx[property].counter || 0
  ctx[property].counter++
  ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``)
  // Writing message to Array `messages` into database which already has sessions Array
  ctx[property + 'DB'].get('messages').push([ctx.message]).write()
  // `property`+'DB' is a name of property which contains lowdb instance, default = `sessionDB`, in current example = `dataDB`
  // ctx.dataDB.get('messages').push([ctx.message]).write()

  return next()
})

bot.command('/stats', (ctx) => {
  let msg = `Using session object from [Telegraf Context](http://telegraf.js.org/context.html) (\`ctx\`), named \`${property}\`\n`
  msg += `Database has \`${ctx[property].counter}\` messages from @${ctx.from.username || ctx.from.id}`
  ctx.replyWithMarkdown(msg)
})
bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx[property])}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx[property] = null
})

bot.startPolling()
```

#### Another examples located in `/examples` folder (PRs welcome)
Also, you may read comments in  [/lib/session.js](https://github.com/RealSpeaker/telegraf-session-local/blob/master/lib/session.js)

#  

Tema Smirnov and contributors / <github.tema@smirnov.one> / [![Telegram](https://img.shields.io/badge/%F0%9F%92%AC%20Telegram-%40TemaSM-blue.svg)](https://goo.gl/YeV4gk)
