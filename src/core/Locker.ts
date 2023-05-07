export interface Locker {
  /**
   * @returns return flag string when success lock, return undefined when already locked by other proccess
   */
  lock: (id: string) => Promise<string | undefined>

  lockMany: (idList: Iterable<string>) => Promise<Map<string, string | undefined>>

  unlock: (id: string, flag: string) => Promise<void>

  unlockMany: (idFlagMap: Map<string, string | undefined>) => Promise<void>
}
