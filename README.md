# [Telegraf](https://github.com/telegraf/telegraf) Session local

[![NPM Version](https://img.shields.io/npm/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![node](https://img.shields.io/node/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![Build Status](https://travis-ci.org/RealSpeaker/telegraf-session-local.svg?branch=master)](https://travis-ci.org/RealSpeaker/telegraf-session-local)
[![Coverage Status](https://coveralls.io/repos/github/RealSpeaker/telegraf-session-local/badge.svg?branch=master)](https://coveralls.io/github/RealSpeaker/telegraf-session-local?branch=master)
[![Dependency Status](https://david-dm.org/realspeaker/telegraf-session-local.svg)](https://david-dm.org/realspeaker/telegraf-session-local)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![Greenkeeper badge](https://badges.greenkeeper.io/RealSpeaker/telegraf-session-local.svg)](https://greenkeeper.io/)

> Middleware for locally stored sessions & database

### ⚡️ Features

- Any type of storage: `Memory`, `FileSync`, `FileAsync`, ... (implement your own)
- Any format you want: `JSON`, `BSON`, `YAML`, `XML`, ... (implement your own)
- Shipped together with power of `lodash`
- Supports basic DB-like operations (thanks to `lodash-id`):

  `getById`, `insert`, `upsert`, `updateById`, `updateWhere`, `replaceById`, `removeById`, `removeWhere`, `createId`,

## 🚀 Installation

```js
$ npm install telegraf-session-local -S
```

### [Documentation & reference](http://realspeaker.github.io/telegraf-session-local/)

## 👀 Quick-start example

```js
const
  Telegraf = require('telegraf'),
  LocalSession = require('telegraf-session-local')

const Bot = new Telegraf(process.env.BOT_TOKEN) // Your Bot token here

Bot.use((new LocalSession({ database: 'example_db.json' })).middleware())

Bot.on('text', (ctx, next) => {
  ctx.session.counter = ctx.session.counter || 0
  ctx.session.counter++
  ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``)
  return next()
})

Bot.command('/stats', (ctx) => {
  ctx.replyWithMarkdown(`Database has \`${ctx.session.counter}\` messages from @${ctx.from.username || ctx.from.id}`)
})

Bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.session)}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx.session = null
})

Bot.startPolling()
```

## 💡 Full example

```js
const
  Telegraf = require('telegraf'),
  LocalSession = require('telegraf-session-local')

const Bot = new Telegraf(process.env.BOT_TOKEN) // Your Bot token here

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
Bot.use(localSession.middleware(property))

Bot.on('text', (ctx, next) => {
  ctx[property].counter = ctx[property].counter || 0
  ctx[property].counter++
  ctx.replyWithMarkdown(`Counter updated, new value: \`${ctx.session.counter}\``)
  // Writing message to Array `messages` into database which already has sessions Array
  ctx[property + 'DB'].get('messages').push([ctx.message]).write()
  // `property`+'DB' is a name of property which contains lowdb instance, default = `sessionDB`, in current example = `dataDB`
  // ctx.dataDB.get('messages').push([ctx.message]).write()

  return next()
})

Bot.command('/stats', (ctx) => {
  let msg = `Using session object from [Telegraf Context](http://telegraf.js.org/context.html) (\`ctx\`), named \`${property}\`\n`
  msg += `Database has \`${ctx[property].counter}\` messages from @${ctx.from.username || ctx.from.id}`
  ctx.replyWithMarkdown(msg)
})
Bot.command('/remove', (ctx) => {
  ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx[property])}\``)
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  ctx[property] = null
})

Bot.startPolling()
```

#### Another examples located in `/examples` folder (PRs welcome)
Also, you may read comments in  `/lib/session.js`

## 🎓 Licence &amp; copyright

&copy; 2018 Tema Smirnov / <github.tema@smirnov.one> / [![Telegram](https://img.shields.io/badge/%F0%9F%92%AC%20Telegram-%40TemaSM-blue.svg)](https://goo.gl/YeV4gk)

MIT - [RealSpeaker Group Ltd.](https://github.com/RealSpeaker)
