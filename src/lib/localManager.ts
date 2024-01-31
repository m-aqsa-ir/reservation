function getFieldManager<T>(key: string) {
  return {
    key,
    save(data: T) {
      window.localStorage.setItem(key, JSON.stringify(data))
    },
    load(): T | null {
      const v = window.localStorage.getItem(key)
      if (v == null) return null
      return JSON.parse(v)
    },
    remove() {
      window.localStorage.removeItem(this.key)
    }
  }
}

export type Order = {
  value: number
}

export const LocalStorageItems = {
  order: getFieldManager<Order>("order")
}
