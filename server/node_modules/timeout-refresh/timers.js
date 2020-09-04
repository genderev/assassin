var timers = require('timers')

var enroll = timers.enroll || noop
var active = timers._unrefActive || timers.active || noop
var unenroll = timers.unenroll || noop

module.exports = Timeout

function Timeout (ms, fn, ctx) {
  if (!(this instanceof Timeout)) return new Timeout(ms, fn, ctx)
  this.ms = ms
  this.ontimeout = fn
  this.context = ctx || null
  enroll(this, ms)
  active(this)
}

Timeout.prototype._onTimeout = function () {
  this.ontimeout.call(this.context)
}

Timeout.prototype.refresh = function () {
  active(this)
}

Timeout.prototype.destroy = function () {
  this.ontimeout = null
  unenroll(this)
}

function noop () {}
