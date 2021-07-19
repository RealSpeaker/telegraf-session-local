import {readFile} from 'fs/promises'

import {Context as TelegrafContext} from 'telegraf'
import {Writer} from 'steno'
import Debug from 'debug'

interface SessionEntry<Data> {
  readonly id: string;
  data: Data;
}

interface FileContent<Data> {
  sessions: Array<SessionEntry<Data>>;
}

export interface LocalSessionOptions<TContext, TSession> {
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
   * Function to get identifier for session from {@link https://telegraf.js.org/#/?id=context|Telegraf Context} (may implement it on your own)
   * When it returns undefined or an empty string no session is loaded.
   */
  getSessionKey: (ctx: TContext) => string | undefined;
}

const debug = Debug('telegraf:session-local')

/**
 * Represents a wrapper around locally stored session
 */
export class LocalSession<TContext, TSession extends Record<keyof any, unknown>> {
  private readonly options: LocalSessionOptions<TContext, TSession>
  private readonly writer: Writer

  constructor(options: Partial<LocalSessionOptions<TContext, TSession>> = {}) {
    if ('storage' in options) {
      throw new TypeError('options.storage no longer exists')
    }

    if ('format' in options) {
      throw new TypeError('options.format no longer exists')
    }

    this.options = Object.assign({
      database: 'sessions.json',
      property: 'session',
      state: { },
      getSessionKey: (ctx: TelegrafContext) => {
        if (!ctx.from) return // should never happen

        let chatInstance: number | string
        if (ctx.chat) {
          chatInstance = ctx.chat.id
        } else if (ctx.callbackQuery) {
          chatInstance = ctx.callbackQuery.chat_instance
        } else { // if (ctx.updateType === 'inline_query') {
          chatInstance = ctx.from.id
        }
        return `${chatInstance}:${ctx.from.id}`
      },
    }, options)

    this.writer = new Writer(this.options.database)
  }

  /**
   * Get session key from {@link https://telegraf.js.org/#/?id=context|Telegraf Context}
   *
   * @param ctx - {@link https://telegraf.js.org/#/?id=context|Telegraf Context}
   * @returns Session key
   */
  getSessionKey(ctx: TContext) {
    this._called()
    return this.options.getSessionKey(ctx)
  }

  async getAllSessions() {
    this._called()

    let content: string
    try {
      content = await readFile(this.options.database, 'utf8')
    } catch {
      return []
    }

    const data = JSON.parse(content) as FileContent<TSession>
    return data.sessions
  }

  /**
   * Get session by it's key in database
   *
   * @param key - Key which will be used to find associated session object
   * @returns Session data object or empty object if there's no session in database with this key
   */
  async getSession(key: string) {
    this._called(key)

    const sessions = await this.getAllSessions()
    const session = sessions.find(o => o.id === key)?.data
    if (session) {
      return session
    }

    return JSON.parse(JSON.stringify(this.options.state)) as TSession
  }

  /**
   * Save session to database
   *
   * @param key - Unique Key which will be used to store session object
   * @param data - Session data object (if empty, session will be removed from database)
   * @returns - Promise or Promise-like `.then()` function, with session object at 1-st argument
   */
  async saveSession(key: string, data: TSession) {
    this._called(key, data)
    if (!key) return

    const sessions = await this.getAllSessions()
    const index = sessions.findIndex(o => o.id === key)

    // If there's no data provided, we should remove session record from database
    if (isEmpty(data)) {
      debug('Removing session #', key)
      sessions.splice(index)
    } else if (index < 0) {
      debug('Saving session: %s = %o', key, data)
      debug(' -> Updating')
      sessions.push({id: key, data})
    } else {
      debug('Saving session: %s = %o', key, data)
      debug(' -> Inserting')
      sessions[index]!.data = data
    }

    const fileContent: FileContent<TSession> = {sessions}
    const content = JSON.stringify(fileContent, undefined, '\t')
    await this.writer.write(content)
  }

  /**
   * Session middleware for use in Telegraf
   *
   * @param property - Name of property in {@link https://telegraf.js.org/#/?id=context|Telegraf Context} where session object will be located (overrides `property` at {@link LocalSession} constructor)
   */
  middleware(property = this.options.property): (ctx: TContext, next: () => Promise<void>) => Promise<void> {
    const that = this
    return async (ctx, next) => {
      const key = that.getSessionKey(ctx)
      if (!key) return next()
      debug('Session key: %s', key)
      let session = await that.getSession(key)
      debug('Session data: %o', session);
      // Assigning session object to the Telegraf Context using `property` as a variable name
      Object.defineProperty(ctx, property, {
        get: () => session,
        set: (newValue) => { session = Object.assign({}, newValue) }
      })

      await next()

      this._called()
      debug('Next Middleware -> Key: %s | Session: %o', key, session)
      // TODO: only save when changed?
      await that.saveSession(key, session)
    }
  }

  /**
   * For Debugging purposes only - shows info about what, where & with what args was called
   *
   * @param args - Called function's arguments
   * @private
   */
  private _called(...args: unknown[]) {
    debug('Called function: \n\t-> %s \n\t-> Arguments: \n\t-> %o', ((new Error().stack)?.split('at ')[2])?.trim(), args)
  }
}

function isEmpty(data: unknown): boolean {
  if (data === undefined || data === null) {
    return true
  }

  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).length === 0
  }

  return false
}
