var stream = require('readable-stream')
var inherits = require('inherits')

module.exports = IteratorStream

function IteratorStream (ite) {
  if (!(this instanceof IteratorStream)) return new IteratorStream(ite)
  stream.Readable.call(this, {objectMode: true})

  this.iterator = ite
  this.onread = onread.bind(null, this)
  this.destroyed = false
}

inherits(IteratorStream, stream.Readable)

IteratorStream.prototype._read = function () {
  this.iterator.next(this.onread)
}

IteratorStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true

  var self = this

  this.iterator.destroy(function (error) {
    if (!err) err = error
    if (err) self.emit('error', err)
    self.emit('close')
  })
}

function onread (self, err, value) {
  if (err) self.destroy(err)
  else self.push(value)
}
