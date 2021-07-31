import {promises} from 'fs'

import {Writer} from 'steno'
import debugPackage from 'debug'

// TODO: use from 'fs/promises' once Node.js 12 support is dropped
const {readFile} = promises

const debug = debugPackage('telegraf:session-local')

interface SessionEntry<Data> {
  readonly id: string;
  readonly data: Data;
}

interface FileContent<Data> {
  readonly sessions: Array<SessionEntry<Data>>;
}

interface MinimalContext {
  readonly from?: {
    readonly id: number;
  };
  readonly chat?: {
    readonly id: number;
  };
  readonly callbackQuery?: {
    readonly chat_instance?: string;
  };
}

export interface LocalSessionOptions<TContext, TSession> {
  /**
   * Name or path to database file `default:` `'sessions.json'`
   */
  readonly database: string;

  /**
   * Name of property in {@link https://telegraf.js.org/#/?id=context|Telegraf Context} where session object will be located `default:` `'session'`
   */
  readonly property: string;

  /**
   * Initial state of database. You can use it to pre-init database Arrays/Objects to store your own data `default:` `{}`
   */
  readonly state: TSession;

  /**
   * Function to get identifier for session from {@link https://telegraf.js.org/#/?id=context|Telegraf Context} (may implement it on your own)
   * When it returns undefined or an empty string no session is loaded.
   */
  readonly getSessionKey: (ctx: TContext) => string | undefined;
}

/**
 * Represents a wrapper around locally stored session
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export class LocalSession<TContext extends MinimalContext, TSession extends {}> {
  private readonly options: LocalSessionOptions<TContext, TSession>
  private readonly writer: Writer

  constructor(options: Partial<LocalSessionOptions<TContext, TSession>> = {}) {
    if ('storage' in options) {
      throw new TypeError('options.storage no longer exists')
    }

    if ('format' in options) {
      throw new TypeError('options.format no longer exists')
    }

    // eslint-disable-next-line prefer-object-spread
    this.options = Object.assign({
      database: 'sessions.json',
      property: 'session',
      state: {},
      getSessionKey: (ctx: TContext) => {
        if (!ctx.from) {
          // Should never happen
          return undefined
        }

        const chatInstance = ctx.chat?.id
          ?? ctx.callbackQuery?.chat_instance
          ?? ctx.from.id

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
    if (!key) {
      throw new Error('key has to be defined')
    }

    const sessions = await this.getAllSessions()
    const index = sessions.findIndex(o => o.id === key)

    // If there's no data provided, we should remove session record from database
    if (isEmpty(data)) {
      debug('Removing session #', key)
      sessions.splice(index)
    } else if (index < 0) {
      debug('Saving session: %s = %o', key, data)
      debug(' -> Inserting')
      sessions.push({id: key, data})
    } else {
      debug('Saving session: %s = %o', key, data)
      debug(' -> Updating')
      sessions[index] = {id: key, data}
    }

    const fileContent: FileContent<TSession> = {sessions}
    const content = JSON.stringify(fileContent, undefined, '\t')
    await this.writer.write(content)
  }

  /**
   * Session middleware for use in Telegraf
   */
  middleware(): (ctx: TContext, next: () => Promise<void>) => Promise<void> {
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const that = this
    return async (ctx, next) => {
      const key = that.getSessionKey(ctx)
      if (!key) {
        return next()
      }

      debug('Session key: %s', key)
      let session = await that.getSession(key)
      debug('Session data: %o', session)
      // Assigning session object to the Telegraf Context using `property` as a variable name
      Object.defineProperty(ctx, this.options.property, {
        get: () => session,
        set: newValue => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          session = {...newValue}
        },
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
  private _called(...args: readonly unknown[]) {
    // eslint-disable-next-line unicorn/error-message
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
