module.exports = class ThunkyMap {
  constructor (load) {
    this.loading = new Map()
    this.cache = new Map()
    this.load = load
  }

  get (key, cb) {
    const v = this.cache.get(key)
    if (v !== undefined) return process.nextTick(cb, null, v)

    if (this.loading.has(key)) {
      this.loading.get(key).push(cb)
      return
    }

    const queue = [cb]
    this.loading.set(key, queue)
    this._load(key, queue)
  }

  has (key) {
    return this.cache.has(key) || this.loading.has(key)
  }

  delete (key) {
    this.loading.delete(key)
    this.cache.delete(key)
  }

  _load (key, queue) {
    this.load(key, (err, val) => {
      const stored = this.loading.get(key)
      if (stored === queue) this.loading.delete(key)
      else if (!err) err = new Error('Deleted')
      if (!err) this.cache.set(key, val)
      for (const cb of queue) cb(err, val)
    })
  }
}
