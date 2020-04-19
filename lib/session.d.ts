declare module 'telegraf-session-local' {
  import { AdapterSync, AdapterAsync, BaseAdapter } from 'lowdb'
  import { ContextMessageUpdate, Middleware } from 'telegraf'

  interface LocalSessionOptions {
    storage?: AdapterSync | AdapterAsync
    database?: string
    property?: string
    state?: object
    format?: object
    getSessionKey?: (ctx: ContextMessageUpdate) => string
  }

  class LocalSession {
    public DB: AdapterSync | AdapterAsync

    constructor(options?: LocalSessionOptions)

    getSessionKey(ctx: ContextMessageUpdate): string
    getSession(key: string): object
    saveSession(key: string, data: object): Promise<any>
    middleware(property?: string): Middleware<ContextMessageUpdate>
    static get storagefileSync(): AdapterSync
    static get storagefileAsync(): AdapterAsync
    static get storageFileSync(): AdapterSync
    static get storageFileAsync(): AdapterAsync
    static get storageMemory(): AdapterSync
    static get storageBase(): BaseAdapter
  }

  export function isPromise(obj: any): boolean
  export default LocalSession
}

