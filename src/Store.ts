export type get = (id: string) => Promise<any>
export type getMany = (idList: string[]) => Promise<Map<string, any>>

export interface Store {
  get: get
  getMany: getMany
}
