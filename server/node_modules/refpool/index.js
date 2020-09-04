const TOS = require('time-ordered-set')

class Entry {
  constructor (pool, key, val) {
    this.pool = pool
    this.prev = null
    this.next = null
    this.key = key
    this.value = val
    this.refs = 0
  }

  bump () {
    if (!this.refs) return
    this.pool.gcable.add(this)
    this.pool._gcMaybe()
  }

  delete () {
    this.pool.gcable.remove(this)
    this.pool.entries.delete(this.key)
    if (this.pool.close) this.pool.close(this.value)
  }

  increment () {
    this.refs++
    if (this.refs === 1) {
      this.pool.gcable.remove(this)
    }
    this.pool._gcMaybe()
  }

  decrement () {
    this.refs--
    if (this.refs === 0) {
      this.pool.gcable.add(this)
      this.pool._gcMaybe()
    }
    this.pool._gcMaybe()
  }
}

module.exports = class Pool {
  constructor ({ maxSize = Infinity, close } = {}) {
    this.maxSize = maxSize
    this.close = close
    this.gcable = new TOS()
    this.entries = new Map()
  }

  get size () {
    return this.entries.size
  }

  isFull () {
    return this.entries.size < this.maxSize
  }

  entry (key) {
    return this.entries.get(key)
  }

  get (key, bump = true) {
    const entry = this.entry(key)
    if (!entry) return
    if (bump) entry.bump()
    return entry.value
  }

  delete (key) {
    const e = this.entry(key)
    if (e) e.delete()
  }

  add (val, forceGC = false) {
    return this.set(val, val, forceGC)
  }

  has (key) {
    return this.entries.has(key)
  }

  set (key, val, forceGC = false) {
    const existing = this.entries.get(key)
    if (existing) {
      existing.bump()
      existing.value = val
      return existing
    }
    const entry = new Entry(this, key, val)
    this.gcable.add(entry)
    this.entries.set(key, entry)
    // allow gc list to grow by one if otherwise we could destroy ourself unless forceGC is set
    this._gcMaybe(!forceGC)
    return entry
  }

  gc () {
    const oldest = this.gcable.oldest
    if (!oldest) return null
    oldest.delete()
    return oldest.value
  }

  _gcMaybe (allowOne = false) {
    if (this.gcable.length === 1 && allowOne) return
    if (this.entries.size <= this.maxSize && this.close) return
    this.gc()
  }

  increment (key) {
    const e = this.entry(key)
    if (e) e.increment()
  }

  decrement (key) {
    const e = this.entry(key)
    if (e) e.decrement()
  }

  bump (key) {
    const e = this.entry(key)
    if (e) e.bump()
  }
}
