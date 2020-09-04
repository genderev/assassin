var Transform = require('readable-stream').Transform
var util = require('util')
var debug = require('debug')('byte-stream')

module.exports = MargaretBatcher

util.inherits(MargaretBatcher, Transform)

function getLength(obj) {
  return obj.length || 1
}

function MargaretBatcher(opts) {
  if (!(this instanceof MargaretBatcher)) {
    return new MargaretBatcher(opts)
  }
  if (typeof opts !== 'object') opts = {limit:opts} // backward compat
  Transform.call(this, {objectMode:true, highWaterMark:2})
  this.limit = opts.limit || 4096 // 4KB, arbitrary
  this.time = opts.time
  this.destroyed = false
  this.getLength = opts.length || getLength
  this.currentTime = Date.now()
  this.currentBatch = []
  this.size = 0
  this._push = this._push.bind(this)
  debug('constructor (limit: %d, time: %s)', this.limit, this.time || null)
}

MargaretBatcher.prototype.destroy = function(err) {
  if (this.destroyed) return
  this.destroyed = true

  debug('destroy')

  if (this.timeout) clearTimeout(this.timeout)
  if (err) this.emit('error', err)
  this.emit('close')
}

MargaretBatcher.prototype._transform = function(obj, _, cb) {
  if (this.time && !this.timeout) {
    this.timeout = setTimeout(this._push, this.time)
    if (this.timeout.unref) this.timeout.unref()
  }

  var len = this.getLength(obj)

  // we are overflowing - drain first
  if (this.size + len > this.limit) this._push()

  this.currentBatch.push(obj)
  this.size += len
  
  debug('push (size: %d, total: %d)', len, this.size)

  // bigger than limit - just drain
  if (this.size >= this.limit) this._push()

  cb()
}

MargaretBatcher.prototype._push = function() {
  if (this.timeout) clearTimeout(this.timeout)
  if (!this.currentBatch.length) return
  var batch = this.currentBatch
  this.size = 0
  this.timeout = null
  this.currentBatch = []
  this.currentTime = Date.now()
  this.push(batch)
}

MargaretBatcher.prototype._flush = function(cb) {
  this._push()
  cb()
}
