import {Context as TelegrafContext, MiddlewareFn} from 'telegraf'
import * as lowdb from 'lowdb'
import * as storageFileAsync from 'lowdb/adapters/FileAsync'
import * as storageFileSync from 'lowdb/adapters/FileSync'
import * as storageMemory from 'lowdb/adapters/Memory'
import Debug from 'debug'
import isPromise from 'is-promise'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const lodashId = require('lodash-id')

export interface LocalSessionOptions<TSession> {
  /**
   * lowdb storage option for implementing your own storage read/write operations `default:` {@link LocalSession.storageFileSync|LocalSession.storageFileSync}
   */
  storage: lowdb.AdapterSync | lowdb.AdapterAsync;

  /**
   * Name or path to database file `default:` `'sessions.json'`
   */
  database: string;

  /**
   * Name of property in {@link https://telegraf.js.org/#/?id=context|Telegraf Context} where session object will be located `default:` `'session'`
   */
  property: string;

  /**
   * Initial state of database. You can use it to pre-init database Arrays/Objects to store your own data `default:` `{}`
   */
  state: TSession;

  /**
   * lowdb storage format option for implementing your own database format for read/write operations
   */
  format: {
    /**
     * lowdb storage serialize function, must return data (usually string) `default:` {@link https://goo.gl/dmGpZd|JSON.stringify()}
     */
    serialize?: (value: TSession) => string;

    /**
     * lowdb storage deserialize function, must return an object `default:` {@link https://goo.gl/wNy3ar|JSON.parse()}
     */
    deserialize?: (value: string) => TSession;
  };

  /**
   * Function to get identifier for session from {@link https://telegraf.js.org/#/?id=context|Telegraf Context} (may implement it on your own)
   */
  getSessionKey: (ctx: TelegrafContext) => string;
}

const debug = Debug('telegraf:session-local')

/**
 * Represents a wrapper around locally stored session, it's {@link LocalSession#middleware|middleware} & lowdb
 */
export class LocalSession<TSession> {
  public DB: any

  private readonly _adapter: any
  private readonly options: LocalSessionOptions<TSession>

  constructor (options: Partial<LocalSessionOptions<TSession>> = {}) {
    this.options = Object.assign({
      // TODO: Use storageFileAsync as default with support of Promise or Promise-like initialization, see: https://git.io/fA3ZN
      storage: LocalSession.storageFileSync,
      database: 'sessions.json',
      property: 'session',
      state: { },
      format: { },
      getSessionKey: (ctx: TelegrafContext) => {
        if (!ctx.from) return // should never happen

        let chatInstance
        if (ctx.chat) {
          chatInstance = ctx.chat.id
        } else if (ctx.callbackQuery) {
          chatInstance = ctx.callbackQuery.chat_instance
        } else { // if (ctx.updateType === 'inline_query') {
          chatInstance = ctx.from.id
        }
        return chatInstance + ':' + ctx.from.id
      }
    }, options)
    this.DB = undefined
    this._adapter = undefined
    // DISABLED: this.options.defaultValue = this.options.state // Backward compatability with old lowdb
    const defaultAdaptersOptions = Object.assign(
      { defaultValue: this.options.state },
      this.options.format.serialize ? { serialize: this.options.format.serialize } : {},
      this.options.format.deserialize ? { deserialize: this.options.format.deserialize } : {}
    )
    if (this.options.storage === LocalSession.storageMemory) {
      debug('Initiating: lowdb adapter: storageMemory')
      this._adapter = new LocalSession.storageMemory(this.options.database, defaultAdaptersOptions)
    } else if (this.options.storage === LocalSession.storageFileAsync) {
      debug('Initiating: lowdb adapter: storageFileAsync')
      this._adapter = new LocalSession.storageFileAsync(this.options.database, defaultAdaptersOptions)
    } else if (this.options.storage === LocalSession.storageFileSync) {
      debug('Initiating: lowdb adapter: storageFileSync')
      this._adapter = new LocalSession.storageFileSync(this.options.database, defaultAdaptersOptions)
    } else {
      debug('Initiating: lowdb adapter: custom storage/adapter')
      this._adapter = new this.options.storage(this.options.database, defaultAdaptersOptions)
    }
    debug('Initiating: lowdb instance')
    const DbInstance = lowdb(this._adapter)
    // If lowdb initiated with async (Promise) adapter
    if (isPromise(DbInstance)) {
      debug('DbInstance is Promise like')
      // TODO: Split it from constructor, because this code will produce glitches if async initiating may take too long time
      this.DB = DbInstance
      this.DB.then((DB: any) => {
        debug('DbInstance Promise resolved')
        this.DB = DB
        this._initDB()
      })
    }
    // If lowdb initiated with sync adapter
    else {
      this.DB = DbInstance
      this._initDB()
    }
  }

  /**
   * Get session key from {@link https://telegraf.js.org/#/?id=context|Telegraf Context}
   *
   * @param ctx - {@link https://telegraf.js.org/#/?id=context|Telegraf Context}
   * @returns Session key in format `number:number` (chat.id:from.id)
   */
  getSessionKey (ctx: TelegrafContext) {
    this._called()
    return this.options.getSessionKey(ctx)
  }

  /**
   * Get session by it's key in database
   *
   * @param key - Key which will be used to find associated session object
   * @returns Session data object or empty object if there's no session in database with this key
   */
  getSession (key: string) {
    this._called(arguments)
    const session = this.DB.get('sessions').getById(key).value() || {}
    debug('Session state', session)
    return session.data || {}
  }

  /**
   * Save session to database
   *
   * @param key - Unique Key which will be used to store session object
   * @param data - Session data object (if empty, session will be removed from database)
   * @returns - Promise or Promise-like `.then()` function, with session object at 1-st argument
   */
  async saveSession (key: string, data: TSession) {
    this._called(arguments)
    if (!key) return
    // If there's no data provided or it's empty, we should remove session record from database
    if (this.DB._.isEmpty(data)) {
      debug('Removing session #', key)
      return this.DB.get('sessions').removeById(key).write()
    }
    debug('Saving session: %s = %o', key, data)
    /* eslint-disable brace-style */
    // If database has record, then just update it
    if (this.DB.get('sessions').getById(key).value()) {
      debug(' -> Updating')
      const session = await this.DB.get('sessions').updateById(key, { data: data }).write()
      // Check if lowdb Storage returned var type is Promise-like or just sync-driven data
      return session
    }
    // If no, so we should push new record into it
    else {
      debug(' -> Inserting')
      const session = await this.DB.get('sessions').push({ id: key, data: data }).write()
      // Check if lowdb Storage returned var type is Promise-like or just sync-driven data
      return session[0]
    }
    /* eslint-enable brace-style */
  }

  /**
   * Session middleware for use in Telegraf
   *
   * @param property - Name of property in {@link https://telegraf.js.org/#/?id=context|Telegraf Context} where session object will be located (overrides `property` at {@link LocalSession} constructor)
   */
  middleware (property = this.options.property): MiddlewareFn<TelegrafContext> {
    const that = this
    return async (ctx, next) => {
      const key = that.getSessionKey(ctx)
      if (!key) return next()
      debug('Session key: %s', key)
      let session = that.getSession(key)
      debug('Session data: %o', session)
      // Assigning session object to the Telegraf Context using `property` as a variable name
      Object.defineProperty(ctx, property, {
        get: () => session,
        set: (newValue) => { session = Object.assign({}, newValue) }
      })
      // Make lowdb available in the Telegraf Context
      Object.defineProperty(ctx, `${property}DB`, {
        get: () => that.DB,
        set: () => { }
      })
      // Saving session object on the next middleware
      await next()

      this._called(arguments)
      debug('Next Middleware -> Key: %s | Session: %o', key, session)
      return that.saveSession(key, session)
    }
  }

  /**
   * lowdb storage named {@link https://git.io/vhM3Y|fileSync} before {@link https://git.io/vhM3Z|lowdb@0.17.0}
   *
   * @memberof! LocalSession
   * @name LocalSession.storagefileSync
   * @alias LocalSession.storageFileSync
   * @readonly
   */
  static get storagefileSync () {
    return storageFileSync
  }

  /**
   * lowdb storage/adapter named {@link https://git.io/vhMqc|FileSync}
   *
   * @memberof! LocalSession
   * @name LocalSession.storageFileSync
   * @global
   * @readonly
   */
  static get storageFileSync () {
    return storageFileSync
  }

  /**
   * lowdb storage named {@link https://git.io/vhM3m|fileAsync} before {@link https://git.io/vhM3Z|lowdb@0.17.0}
   *
   * @memberof! LocalSession
   * @name LocalSession.storagefileAsync
   * @alias LocalSession.storageFileAsync
   * @readonly
   */
  static get storagefileAsync () {
    return storageFileAsync
  }

  /**
   * lowdb storage/adapter named {@link https://git.io/vhMqm|FileAsync}
   *
   * @memberof! LocalSession
   * @name LocalSession.storageFileAsync
   * @global
   * @readonly
   */
  static get storageFileAsync () {
    return storageFileAsync
  }

  /**
   * lowdb storage/adapter named {@link https://git.io/vhMqs|Memory}
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
   * lowdb {@link https://git.io/vhMOK|storage/adapter base} constructor (to extend it in your custom storage/adapter)
   *
   * @memberof! LocalSession
   * @name LocalSession.storageBase
   * @global
   * @readonly
   */
  static get storageBase () {
    return require('lowdb/adapters/Base')
  }

  /**
   * For Debugging purposes only - shows info about what, where & with what args was called
   *
   * @param args - Called function's arguments
   * @private
   */
  private _called (...args: unknown[]) {
    debug('Called function: \n\t-> %s \n\t-> Arguments: \n\t-> %o', ((new Error().stack)?.split('at ')[2])?.trim(), this.DB._.values(args))
  }

  private _initDB() {
    // Use ID based resources, so we can query records by ID (ex.: getById(), removeById(), ...)
    this.DB._.mixin(lodashId)
    // If database is empty, fill it with empty Array of sessions and optionally with initial state
    this.DB.defaults(Object.assign({ sessions: [] }, this.options.state)).write()
    debug('Initiating finished')
    return true
  }
}
