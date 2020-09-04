var tape = require('tape')
var nanoiterator = require('./')
var toStream = require('./to-stream')

tape('basic', function (t) {
  var data = ['a', 'b', 'c', null]
  var expected = data.slice(0)

  var ite = nanoiterator({
    next: cb => cb(null, data.shift())
  })

  ite.next(function loop (err, value) {
    t.error(err, 'no error')
    t.same(value, expected.shift(), 'expected value')
    if (value) ite.next(loop)
    else t.end()
  })
})

tape('concurrent next', function (t) {
  var data = ['a', 'b', 'c', null]

  var ite = nanoiterator({
    next: function (cb) {
      t.ok(data.length > 0, 'has data')
      cb(null, data.shift())
    }
  })

  ite.next(function (err, value) {
    t.error(err, 'no error')
    t.same(value, 'a', 'expected a')
  })
  ite.next(function (err, value) {
    t.error(err, 'no error')
    t.same(value, 'b', 'expected b')
  })
  ite.next(function (err, value) {
    t.error(err, 'no error')
    t.same(value, 'c', 'expected c')
  })
  ite.next(function (err, value) {
    t.error(err, 'no error')
    t.same(value, null, 'expected null')
  })
  ite.next(function (err, value) {
    t.error(err, 'no error')
    t.same(value, null, 'expected null')
    t.end()
  })
})

tape('next inside next cb', function (t) {
  var n = 0
  var ite = nanoiterator({
    next: cb => process.nextTick(cb, null, n++)
  })

  ite.next(function (err, n) {
    t.error(err, 'no error')
    t.same(n, 0)
    ite.next(function (err, n) {
      t.error(err, 'no error')
      t.same(n, 1)
    })
    ite.next(function (err, n) {
      t.error(err, 'no error')
      t.same(n, 2)
      t.end()
    })
  })
})

tape('open', function (t) {
  t.plan(4 + 2 + 2)

  var cnt = 0
  var ite = nanoiterator({
    open: function (cb) {
      t.notOk(ite.opened, '.opened set after open')
      t.pass('was opened')
      cb()
    },
    next: function (cb) {
      t.ok(ite.opened, 'is opened')
      cb(null, cnt++)
    }
  })

  ite.next(function (err, val) {
    t.error(err, 'no error')
    t.same(val, 0)
    ite.next(function (err, val) {
      t.error(err, 'no error')
      t.same(val, 1)
    })
  })
})

tape('no next', function (t) {
  t.plan(2)

  var ite = nanoiterator()
  ite.next(function (err) {
    t.same(err, new Error('_next was not implemented'))
  })

  ite = nanoiterator({})
  ite.next(function (err) {
    t.same(err, new Error('_next was not implemented'))
  })
})

tape('destroy', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    destroy: function (cb) {
      t.pass('_destroy is called')
      cb()
    }
  })

  ite.destroy(function () {
    t.ok(ite.closed, 'destroyed')
  })
  ite.next(function (err) {
    t.same(err, new Error('Iterator is destroyed'))
  })
})

tape('destroy while next', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    next: function (cb) {
      t.fail('_next is never called')
    },
    destroy: function (cb) {
      t.pass('_destroy is called')
      cb()
    }
  })

  ite.destroy(function () {
    t.ok(ite.closed, 'destroyed')
  })
  ite.next(function (err) {
    t.same(err, new Error('Iterator is destroyed'))
  })
})

tape('open fails', function (t) {
  var ite = nanoiterator({
    open: function (cb) {
      cb(new Error('open fails'))
    },
    next: function () {
      t.fail('next should not be called')
    }
  })

  ite.next(function (err) {
    t.same(err, new Error('open fails'))
    t.end()
  })
})

tape('destroy optional callback', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    next: function (cb) {
      t.pass('_next is called')
      process.nextTick(cb)
    },
    destroy: function (cb) {
      t.pass('_destroy is called')
      cb()
    }
  })

  ite.next(function (err) {
    t.same(err, new Error('Iterator is destroyed'))
  })
  ite.destroy()
})

tape('destroy with default _destroy', function (t) {
  t.plan(2)

  var ite = nanoiterator()

  ite.destroy(function () {
    t.ok(ite.closed, 'should be closed')
  })
  ite.next(function (err) {
    t.same(err, new Error('Iterator is destroyed'))
  })
})

tape('destroy twice', function (t) {
  t.plan(5)

  var ite = nanoiterator()
  var first = true

  ite.destroy(function () {
    t.ok(first, 'is first')
    t.ok(ite.closed, 'should be closed')
    first = false
  })
  ite.destroy(function () {
    t.notOk(first, 'is not first')
    t.ok(ite.closed, 'should be closed')
  })
  ite.next(function (err) {
    t.same(err, new Error('Iterator is destroyed'))
  })
})

tape('to-stream', function (t) {
  var data = ['a', 'b', 'c', null]
  var expected = data.slice(0, -1)

  var ite = nanoiterator({
    next: cb => cb(null, data.shift())
  })

  var s = toStream(ite)

  s.on('data', function (data) {
    t.same(data, expected.shift())
  })

  s.on('end', function () {
    t.same(expected.length, 0)
    t.end()
  })
})

tape('to-stream error', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    next: cb => cb(new Error('stop')),
    destroy: function (cb) {
      t.pass('destroy called')
      cb()
    }
  })

  var s = toStream(ite)

  s.on('error', function (err) {
    t.same(err, new Error('stop'))
  })

  s.on('close', function () {
    t.pass('closed')
  })

  s.resume()
})

tape('to-stream destroy', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    next: cb => cb(null, null),
    destroy: function (cb) {
      t.pass('destroy called')
      cb()
    }
  })

  var s = toStream(ite)

  s.on('error', function (err) {
    t.same(err, new Error('stop'))
  })

  s.on('close', function () {
    t.pass('closed')
  })

  s.destroy(new Error('stop'))
})

tape('to-stream destroy errors', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    next: cb => cb(null, 'hi'),
    destroy: function (cb) {
      t.pass('destroy called')
      cb(new Error('stop'))
    }
  })

  var s = toStream(ite)

  s.on('error', function (err) {
    t.same(err, new Error('stop'))
  })

  s.on('close', function () {
    t.pass('closed')
  })

  s.destroy()
})

tape('to-stream destroy twice', function (t) {
  t.plan(3)

  var ite = nanoiterator({
    next: cb => cb(null, 'hi'),
    destroy: function (cb) {
      t.pass('destroy called')
      cb(new Error('stop'))
    }
  })

  var s = toStream(ite)

  s.on('error', function (err) {
    t.same(err, new Error('stop'))
  })

  s.on('close', function () {
    t.pass('closed')
  })

  s.destroy()
  s.destroy()
})

tape('always async', function (t) {
  var ite = nanoiterator({
    next: cb => cb(null, 'hi')
  })

  var sync = true
  ite.next(function () {
    t.notOk(sync, 'not sync')
    sync = true
    ite.destroy(function () {
      t.notOk(sync, 'not sync')
      t.end()
    })
    sync = false
  })
  sync = false
})

tape('not double async', function (t) {
  var ite = nanoiterator({
    next: cb => process.nextTick(cb, null, 'hi')
  })

  var flag = false
  ite.next(function () {
    t.notOk(flag, 'not set')
    t.end()
  })

  process.nextTick(function () {
    flag = true
  })
})
