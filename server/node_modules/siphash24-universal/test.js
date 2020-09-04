const tape = require('tape')
const siphash = require('./')
const browserSiphash = require('./browser')

tape('basic', function (t) {
  const a = Buffer.alloc(8)
  const b = Buffer.alloc(8)

  siphash(a, Buffer.from('hi'), Buffer.alloc(16))
  browserSiphash(b, Buffer.from('hi'), Buffer.alloc(16))

  t.same(a, b)
  t.end()
})
