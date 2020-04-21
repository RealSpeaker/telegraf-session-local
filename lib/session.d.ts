declare module 'telegraf-session-local' {
  import { AdapterSync, AdapterAsync, BaseAdapter } from 'lowdb'
  import { ContextMessageUpdate, Middleware } from 'telegraf'

  export interface LocalSessionOptions {
    storage?: AdapterSync | AdapterAsync
    database?: string
    property?: string
    state?: object
    format?: {
        serialize?: (value: any) => string;
        deserialize?: (value: string) => any;
    };
    getSessionKey?: (ctx: ContextMessageUpdate) => string
  }

  class LocalSession<TSession> {
    public DB: AdapterSync | AdapterAsync

    constructor(options?: LocalSessionOptions)

    getSessionKey(ctx: ContextMessageUpdate): string
    getSession(key: string): TSession
    saveSession(key: string, data: TSession): Promise<any>
    middleware(property?: string): Middleware<ContextMessageUpdate>
    static get storagefileSync(): AdapterSync
    static get storagefileAsync(): AdapterAsync
    static get storageFileSync(): AdapterSync
    static get storageFileAsync(): AdapterAsync
    static get storageMemory(): AdapterSync
    static get storageBase(): BaseAdapter
  }

  export default LocalSession
}

