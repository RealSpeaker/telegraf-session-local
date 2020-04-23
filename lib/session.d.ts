declare module 'telegraf-session-local' {
  import { AdapterSync, AdapterAsync, BaseAdapter, lowdb } from 'lowdb'
  import { ContextMessageUpdate, Middleware } from 'telegraf'

  export interface LocalSessionOptions<TSession> {
    storage?: AdapterSync | AdapterAsync
    database?: string
    property?: string
    state?: TSession
    format?: {
        serialize?: (value: TSession) => string;
        deserialize?: (value: string) => TSession;
    };
    getSessionKey?: (ctx: ContextMessageUpdate) => string
  }

  class LocalSession<TSession> {
    public DB: lowdb

    constructor(options?: LocalSessionOptions<TSession>)

    getSessionKey(ctx: ContextMessageUpdate): string
    getSession(key: string): TSession
    saveSession(key: string, data: TSession): Promise<TSession>
    middleware(property?: string): Middleware<ContextMessageUpdate>
    static get storageFileSync(): AdapterSync
    static get storageFileAsync(): AdapterAsync
    static get storageMemory(): AdapterSync
    static get storageBase(): BaseAdapter
  }

  export default LocalSession
}
