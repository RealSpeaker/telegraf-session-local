/* eslint object-curly-spacing: ["error", "always"] */
const
	Telegraf = require('telegraf'),
	LocalSession = require('../lib/session'),
	should = require('should'),
	debug = require('debug')('telegraf:session-local:test'),
	options = { database: 'test_db.json' }

describe('Telegraf Local Session', function () {
	it('should retrieve and save session', function (done) {
		const localSession = new LocalSession(options)
		const key = '1:1' // ChatID:FromID
		let session = localSession.getSession(key)
		debug('getSession %O', session)
		should.exist(session)
		session.foo = 42
		localSession.saveSession(key, session).then(sess => {
			debug('Saved session %O', sess)
			should.exist(sess)
			sess.data.should.be.deepEqual({ foo: 42 })
			done()
		})
	})

	it('should be defined', function (done) {
		const bot = new Telegraf()
		const localSession = new LocalSession(options)
		bot.on('text', localSession.middleware(), (ctx) => {
			debug('Middleware session %O', ctx.session)
			should.exist(ctx.session)
			ctx.session.foo = 42
			debug('Updated Middleware session %O', ctx.session)
			done()
		})
		bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
	})

	it('should handle existing session', function (done) {
		const bot = new Telegraf()
		const localSession = new LocalSession(options)
		bot.on('text', localSession.middleware(), (ctx) => {
			debug('Existing Middleware session %O', ctx.session)
			should.exist(ctx.session)
			ctx.session.should.have.property('foo')
			ctx.session.foo.should.be.equal(42)
			done()
		})
		bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
	})

	it('should handle not existing session', function (done) {
		const bot = new Telegraf()
		const localSession = new LocalSession(options)
		bot.on('text', localSession.middleware(), (ctx) => {
			debug('Not Existing Middleware session %O', ctx.session)
			should.exist(ctx.session)
			ctx.session.should.not.have.property('foo')
			done()
		})
		bot.handleUpdate({ message: { chat: { id: 1337 }, from: { id: 1337 }, text: 'hey' } })
	})

	it('should handle session reset', function (done) {
		const bot = new Telegraf()
		const localSession = new LocalSession(options)
		bot.on('text', localSession.middleware(), (ctx) => {
			debug('Middleware session reset - before %O', ctx.session)
			ctx.session = null
			should.exist(ctx.session)
			ctx.session.should.not.have.property('foo')
			debug('Middleware session reset - after %O', ctx.session)
			done()
		})
		bot.handleUpdate({ message: { chat: { id: 1 }, from: { id: 1 }, text: 'hey' } })
	})
})
