# [Telegraf](https://github.com/telegraf/telegraf) Session local

[![NPM Version](https://img.shields.io/npm/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![Nodejs](https://img.shields.io/node/v/telegraf-session-local.svg?style=flat-square)](https://www.npmjs.com/package/telegraf-session-local)
[![npm](https://img.shields.io/npm/dm/telegraf-session-local.svg?style=flat-square)](https://npmcharts.com/compare/telegraf-session-local,telegraf-session-redis,telegraf-session-mysql,telegraf-session-mongo,telegraf-session-dynamodb?interval=30)
[![GitHub Actions Status](https://img.shields.io/github/workflow/status/RealSpeaker/telegraf-session-local/CI?style=flat-square)](https://github.com/RealSpeaker/telegraf-session-local/actions)
[![Coveralls](https://img.shields.io/coveralls/github/RealSpeaker/telegraf-session-local/master.svg?style=flat-square)](https://coveralls.io/github/RealSpeaker/telegraf-session-local?branch=master)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/g/RealSpeaker/telegraf-session-local.svg?style=flat-square&?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/RealSpeaker/telegraf-session-local/context:javascript)
[![David](https://img.shields.io/david/RealSpeaker/telegraf-session-local.svg?style=flat-square)](https://david-dm.org/RealSpeaker/telegraf-session-local)

> Middleware for locally stored sessions & database

### ⚡️ Features

… all gone?

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
import {Telegraf} from 'telegraf'
import {LocalSession} from 'telegraf-session-local'

const bot = new Telegraf(process.env['BOT_TOKEN']!) // Your Bot token here

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

bot.launch()
```

## 📄 Full example

```ts
import {Telegraf, Context as TelegrafContext} from 'telegraf'
import {LocalSession} from 'telegraf-session-local'

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

bot.command('/stats', async (ctx) => {
  let msg = 'Using session object from [Telegraf Context](http://telegraf.js.org/context.html) (`ctx`), named `data`\n'
  msg += `Database has \`${String(ctx.data.counter)}\` messages from @${ctx.from.username ?? ctx.from.id}`
  await ctx.replyWithMarkdown(msg)
})
bot.command('/remove', async (ctx) => {
  await ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.data)}\``);
  // Setting session to null, undefined or empty object/array will trigger removing it from database
  (ctx as any).data = null
})

bot.launch()
```

#### Another examples located in `/examples` folder (PRs welcome)
Also, you may read comments in  [/source/index.ts](https://github.com/RealSpeaker/telegraf-session-local/blob/master/source/index.ts)

#

Tema Smirnov and contributors / <github.tema@smirnov.one> / [![Telegram](https://img.shields.io/badge/%F0%9F%92%AC%20Telegram-%40TemaSM-blue.svg)](https://goo.gl/YeV4gk)
