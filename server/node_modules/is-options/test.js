const tape = require('tape')
const isOptions = require('./')

tape('works', function (t) {
  t.ok(isOptions({}))
  t.notOk(isOptions(''))
  t.notOk(isOptions(Buffer.from('hi')))
  t.notOk(isOptions())
  t.notOk(isOptions(null))
  t.notOk(isOptions(42))
  t.notOk(isOptions(undefined))
  t.end()
})
