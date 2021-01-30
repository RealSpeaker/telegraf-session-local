declare module 'telegraf-session-local' {
  import { AdapterSync, AdapterAsync, BaseAdapter } from 'lowdb'
  import { Context } from 'telegraf'

  type MiddlewareFn<C extends Context> = (ctx: C, next: () => Promise<void>) => Promise<void>

  export interface LocalSessionOptions<TSession> {
    storage?: AdapterSync | AdapterAsync
    database?: string
    property?: string
    state?: TSession
    format?: {
        serialize?: (value: TSession) => string
        deserialize?: (value: string) => TSession
    }
    getSessionKey?: (ctx: Context) => string
  }

  class LocalSession<TSession> {
    public DB: unknown

    constructor(options?: LocalSessionOptions<TSession>)

    getSessionKey(ctx: Context): string
    getSession(key: string): TSession
    saveSession(key: string, data: TSession): Promise<TSession>
    middleware(property?: string): MiddlewareFn<Context>
    static get storageFileSync(): AdapterSync
    static get storageFileAsync(): AdapterAsync
    static get storageMemory(): AdapterSync
    static get storageBase(): BaseAdapter
  }

  export = LocalSession
}
