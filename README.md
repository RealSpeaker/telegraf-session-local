# [Telegraf](https://github.com/telegraf/telegraf) Session local

[![NPM Version](https://img.shields.io/npm/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![Nodejs](https://img.shields.io/node/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![NPM downloads/month](https://img.shields.io/npm/dm/telegraf-session-local.svg?style=flat-square)](https://npmcharts.com/compare/telegraf-session-local,telegraf-session-redis,telegraf-session-dynamodb,telegraf-postgres-session,telegraf-session-mysql,telegraf-session-mongoose,telegraf-session-mongo,telegraf-session-rethinkdb?interval=30)
[![GitHub Actions Status](https://img.shields.io/github/actions/workflow/status/RealSpeaker/telegraf-session-local/ci.yml?style=flat-square)](https://github.com/RealSpeaker/telegraf-session-local/actions)
[![Coveralls](https://img.shields.io/coveralls/github/RealSpeaker/telegraf-session-local/master.svg?style=flat-square)](https://coveralls.io/github/RealSpeaker/telegraf-session-local?branch=master)
![Codacy grade](https://img.shields.io/codacy/grade/761ed505ba2d44bd9a2bc598e68969e3?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/RealSpeaker/telegraf-session-local?style=flat-square)

> Middleware for locally stored sessions & database

### ⚡️ Features

- Any type of storage: `Memory`, `FileSync`, `FileAsync`, ... (implement your own)
- Any format you want: `JSON`, `BSON`, `YAML`, `XML`, ... (implement your own)
- Shipped together with power of `lodash`
- Supports basic DB-like operations (thanks to [lodash-id](https://github.com/typicode/lodash-id)):

  `getById`, `insert`, `upsert`, `updateById`, `updateWhere`, `replaceById`, `removeById`, `removeWhere`, `createId`,

## 🚀 Installation

```js
$ npm install -S telegraf-session-local
```

> 💡 TIP: We recommend [`pnpm` package manager](https://pnpm.io/?from=https://github.com/RealSpeaker/telegraf-session-local/): `npm i -g pnpm` and then `pnpm i -S telegraf-session-local`.  
> It's in-place replacement for `npm`, [faster and better](https://pnpm.io/benchmarks) than `npm`/`yarn`, and [saves your disk space](https://pnpm.io/motivation#saving-disk-space-and-boosting-installation-speed).
---
### 📚 [Documentation & API](http://realspeaker.github.io/telegraf-session-local/)
---
## 👀 Quick-start example

```js
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')

const bot = new Telegraf(process.env.BOT_TOKEN) // Your Bot token here

bot.use((new LocalSession({ database: 'example_db.json' })).middleware())

bot.on('text', (ctx, next) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  ctx.replyWithMarkdownV2(`Counter updated, new value: \`${ctx.session.counter}\``)
  return next()
})

bot.command('/stats', (ctx) => {
  ctx.replyWithMarkdownV2(`Database has \`${ctx.session.counter}\` messages from @${ctx.from.username || ctx.from.id}`)
})

bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdownV2(`Removing session from database: \`${JSON.stringify(ctx.session)}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx.session = null
})

bot.launch()
```

## 📄 Full example

```js
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')

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
```

#### Another examples located in `/examples` folder (PRs welcome)
Also, you may read comments in  [/lib/session.js](https://github.com/RealSpeaker/telegraf-session-local/blob/master/lib/session.js)

#

Tema Smirnov and contributors / <github.tema@smirnov.one> / [![Telegram](https://img.shields.io/badge/%F0%9F%92%AC%20Telegram-%40TemaSM-blue.svg)](https://goo.gl/YeV4gk)
