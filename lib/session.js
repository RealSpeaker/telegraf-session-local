const
  debug = require('debug')('telegraf:session-local'),
  lowdb = require('lowdb'),
  storagefileSync = require('lowdb/lib/storages/file-sync'),
  storagefileAsync = require('lowdb/lib/storages/file-async'),
  storageMemory = require('lowdb/lib/storages/memory')

/**
 * Represents a wrapper around locally stored session, it's {@link LocalSession#middleware|middleware} & lowdb
 *
 * @param {Object} [options] - Options for {@link LocalSession|LocalSession} & {@link https://github.com/typicode/lowdb|lowdb}
 * @param {String} [options.database] - Name or path to database file `(default: 'sessions.json')`
 * @param {String} [options.property] - Name of property in {@link http://telegraf.js.org/context.html|Telegraf Context} where session object will be located `(default: 'session')`
 * @param {Object} [options.state] - Initial state of database. You can use it to pre-init database Arrays/Objects to store your own data `(default: {})`
 * @param {Function} [options.getSessionKey] - Function to get identifier for session from {@link http://telegraf.js.org/context.html|Telegraf Context} (may implement it on your own)
 * @param {Object} [options.storage] - lowdb storage option for implementing your own storage read/write operations `(default: {@link https://git.io/v76r9|storagefileAsync})`
 * @param {Function} [options.storage.read] - lowdb storage read function, must return an object or a Promise
 * @param {Function} [options.storage.write] - lowdb storage write function, must return undefined or a Promise
 * @param {Object} [options.format] - lowdb storage format option for implementing your own database format for read/write operations
 * @param {Function} [options.format.serialize] - lowdb storage serialize function, must return data (usually string) `(default: {@link https://goo.gl/dmGpZd|JSON.stringify})`
 * @param {Function} [options.format.deserialize] - lowdb storage serialize function, must return an object `(default: {@link https://goo.gl/wNy3ar|JSON.parse})`
 * @returns Instance of {@link LocalSession|LocalSession}
 */
class LocalSession {
  constructor (options = {}) {
    this.options = Object.assign({
      storage: LocalSession.storagefileAsync,
      database: 'sessions.json',
      property: 'session',
      state: { },
      getSessionKey: (ctx) => {
        if (!ctx.from) return // should never happen

        let chatInstance = ctx.from.id
        if (ctx.chat) {
          chatInstance = ctx.chat.id
        } else if (ctx.updateType === 'callback_query') {
          chatInstance = ctx.callbackQuery.chat_instance
        } else { // if (ctx.updateType === 'inline_query') {
          chatInstance = ctx.from.id
        }
        return chatInstance + ':' + ctx.from.id
      }
    }, options)
    if (this.options.storage === LocalSession.storageMemory) {
      debug('Init lowdb with storageMemory')
      this.DB = lowdb()
    } else {
      debug('Init lowdb')
      this.DB = lowdb(this.options.database, this.options)
    }
    // Use ID based resources, so we can query records by ID (ex.: getById(), removeById(), ...)
    this.DB._.mixin(require('lodash-id'))
    // If database is empty, fill it with empty Array of sessions
    this.DB.defaults(Object.assign({ sessions: [] }, this.options.state)).write()
  }

  /**
   * Get session key from {@link http://telegraf.js.org/context.html|Telegraf Context}
   *
   * @param {Object} ctx - {@link http://telegraf.js.org/context.html|Telegraf Context}
   * @returns {String} Session key in format `number:number` (chat.id:from.id)
   */
  getSessionKey (ctx) {
    this._called()
    return this.options.getSessionKey(ctx)
  }

  /**
   * Get session by it's key in database
   *
   * @param {String} key - Key which will be used to find associated session object
   * @returns {Object} Session data object or empty object if there's no session in database with this key
   */
  getSession (key) {
    this._called(arguments)
    let session
    try {
      session = this.DB.get('sessions').getById(key).value() || {}
    } catch (error) {
      debug('Session state failed', error)
    }
    debug('Session state', session)
    return session.data || {}
  }

  /**
   * Save session to database
   *
   * @param {String} key - Unique Key which will be used to store session object
   * @param {Object} data - Session data object (if empty, session will be removed from database)
   * @returns {Promise|Function} - Promise or Promise-like `.then()` function, with session object at 1-st argument
   */
  saveSession (key, data) {
    this._called(arguments)
    if (!key) return
    // If there's no data provided or it's empty, we should remove session record from database
    if (!data || Object.keys(data).length === 0) {
      debug('Removing session #', key)
      return this.DB.get('sessions').removeById(key).write()
    }
    debug('Saving session: %s = %o', key, data)
    /* eslint-disable brace-style */
    // If database has record, then just update it
    if (this.DB.get('sessions').getById(key).value()) {
      debug(' -> Updating')
      let session = this.DB.get('sessions').updateById(key, { data: data }).write()
      // Check if lowdb Storage returned var type is Promise-like or just sync-driven data
      if (typeof session.then === 'function') {
        return session.then(sess => { return sess })
      } else {
        // For better use of saveSession(), even with sync storage types
        return { then: cb => { return cb(session) } }
      }
    }
    // If no, so we should push new record into it
    else {
      debug(' -> Inserting')
      let session = this.DB.get('sessions').push({ id: key, data: data }).write()
      // Check if lowdb Storage returned var type is Promise-like or just sync-driven data
      if (typeof session.then === 'function') {
        return session.then(_session => { return _session[0] })
      } else {
        // For better use of saveSession(), even with sync storage types
        return { then: cb => { return cb(session[0]) } }
      }
    }
    /* eslint-enable brace-style */
  }

  /**
   * Session middleware for use in Telegraf
   *
   * @param {String} [property] - Name of property in {@link http://telegraf.js.org/context.html|Telegraf Context} where session object will be located (overrides `property` at {@link LocalSession} constructor)
   * @returns {Promise}
   */
  middleware (property = this.options.property) {
    this._called(arguments)
    return (ctx, next) => {
      const key = this.getSessionKey(ctx)
      if (!key) return next()
      debug('Session key: %s', key)
      let session = this.getSession(key)
      debug('Session data: %o', session)
      // Assigning session object to the Telegraf Context using `property` as a variable name
      Object.defineProperty(ctx, property, {
        get: function () { return session },
        set: function (newValue) { session = Object.assign({}, newValue) }
      })
      let that = this
      // Make lowdb available in the Telegraf Context
      Object.defineProperty(ctx, `${property}DB`, {
        get: function () { return that.DB },
        set: function () { }
      })
      // Saving session object on the next middleware
      return next().then(() => {
        this._called(arguments)
        debug('Next Middleware -> Key: %s | Session: %o', key, session)
        return this.saveSession(key, session)
      })
    }
  }

  /**
   * lowdb storage named `{@link https://git.io/v769g|fileSync}`
   *
   * @memberof! LocalSession
   * @name LocalSession.storagefileSync
   * @global
   * @readonly
   */
  static get storagefileSync () {
    return storagefileSync
  }

  /**
   * lowdb storage named `{@link https://git.io/v76r9|fileAsync}`
   *
   * @memberof! LocalSession
   * @name LocalSession.storagefileAsync
   * @global
   * @readonly
   */
  static get storagefileAsync () {
    return storagefileAsync
  }

  /**
   * lowdb storage named `{@link https://git.io/v769o|memory}`
   *
   * @memberof! LocalSession
   * @name LocalSession.storageMemory
   * @global
   * @readonly
   */
  static get storageMemory () {
    return storageMemory
  }

  /**
   * For Debugging purposes only - shows info about what, where & with what args was called
   *
   * @param {Object} args - Called function's arguments
   * @private
   */
  _called (args) {
    debug('Called function: \n\t-> %s \n\t-> Arguments: \n\t-> %o', ((new Error().stack).split('at ')[2]).trim(), this.DB._.values(args))
  }
}

/**
 * @overview {@link http://telegraf.js.org/|Telegraf} Session middleware for storing sessions locally (memory/fileSync/fileAsync/...)
 * @module telegraf-session-local
 * @version 0.0.4
 * @license MIT
 * @author Tema Smirnov <git.tema@smirnov.one>
 * @requires {@link https://www.npmjs.com/package/telegraf|npm: telegraf}
 * @requires {@link https://www.npmjs.com/package/lowdb|npm: lowdb}
 * @see {@link http://telegraf.js.org/|Telegraf} | {@link https://github.com/typicode/lowdb|lowdb}
 * @exports LocalSession
 */
module.exports = LocalSession
