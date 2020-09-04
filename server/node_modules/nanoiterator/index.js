module.exports = NanoIterator

function NanoIterator (opts) {
  if (!(this instanceof NanoIterator)) return new NanoIterator(opts)

  this.opened = false
  this.closed = false
  this.ended = false

  this._nextSync = false
  this._nextQueue = []
  this._nextCallback = null
  this._nextDone = nextDone.bind(null, this)
  this._openDone = openDone.bind(null, this)

  if (opts) {
    if (opts.open) this._open = opts.open
    if (opts.next) this._next = opts.next
    if (opts.destroy) this._destroy = opts.destroy
  }
}

NanoIterator.prototype.next = function (cb) {
  if (this._nextCallback || this._nextQueue.length) {
    this._nextQueue.push(cb)
    return
  }

  this._nextCallback = cb
  this._nextSync = true
  if (!this.opened) this._open(this._openDone)
  else update(this)
  this._nextSync = false
}

NanoIterator.prototype.destroy = function (cb) {
  if (!cb) cb = noop

  if (this.closed) {
    this.next(() => cb())
    return
  }

  this.closed = true
  if (!this._nextCallback) this.opened = true
  this.next(() => this._destroy(cb))
}

NanoIterator.prototype._open = function (cb) {
  cb(null)
}

NanoIterator.prototype._destroy = function (cb) {
  cb(null)
}

NanoIterator.prototype._next = function (cb) {
  cb(new Error('_next is not implemented'))
}

if (typeof Symbol !== 'undefined' && Symbol.asyncIterator) {
  NanoIterator.prototype[Symbol.asyncIterator] = function () {
    var self = this
    return {next: nextPromise, return: returnPromise}

    function returnPromise () {
      return new Promise(function (resolve, reject) {
        self.destroy(function (err) {
          if (err) return reject(err)
          resolve({value: null, done: true})
        })
      })
    }

    function nextPromise () {
      return new Promise(function (resolve, reject) {
        self.next(function (err, val) {
          if (err) return reject(err)
          resolve({value: val, done: val === null})
        })
      })
    }
  }
}

function noop () {}

function openDone (self, err) {
  if (err) return nextDone(self, err, null)
  self.opened = true
  update(self)
}

function nextDone (self, err, value) {
  if (self._nextSync) return nextDoneNT(self, err, value)

  if (self.closed) {
    err = new Error('Iterator is destroyed')
    value = null
  }

  var cb = self._nextCallback
  self._nextCallback = null
  if (!err && value === null) self.ended = true
  cb(err, value)

  if (self._nextCallback || !self._nextQueue.length) return

  self._nextCallback = self._nextQueue.shift()
  update(self)
}

function update (self) {
  if (self.ended || self.closed) nextDoneNT(self, null, null)
  else self._next(self._nextDone)
}

function nextDoneNT (self, err, val) {
  process.nextTick(nextDone, self, err, val)
}
