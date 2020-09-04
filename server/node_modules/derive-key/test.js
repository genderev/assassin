const tape = require('tape')
const derive = require('./')

tape('can derive', function (t) {
  const mk = Buffer.alloc(32)

  t.deepEquals(derive('test', mk, 'a'), derive('test', mk, 'a'))
  t.notDeepEquals(derive('test', mk, 'b'), derive('test', mk, 'a'))
  t.notDeepEquals(derive('test 2', mk, 'a'), derive('test', mk, 'a'))

  t.end()
})
