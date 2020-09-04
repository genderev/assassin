module.exports = Timeout

function Timeout (ms, fn, ctx) {
  if (!(this instanceof Timeout)) return new Timeout(ms, fn, ctx)
  this.ms = ms
  this.ontimeout = fn
  this.context = ctx || null
  this._timeout = setTimeout(call, ms, this)
}

Timeout.prototype.refresh = function () {
  clearTimeout(this._timeout)
  this._timeout = setTimeout(call, this.ms, this)
}

Timeout.prototype.destroy = function () {
  this.ontimeout = null
  clearTimeout(this._timeout)
}

function call (self) {
  self.ontimeout.call(self.context)
}
