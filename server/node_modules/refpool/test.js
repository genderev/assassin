const tape = require('tape')
const Pool = require('./')

tape('basic', function (t) {
  const closes = [4, 2, 3, 5]
  const p = new Pool({
    maxSize: 2,
    close (data) {
      t.same(data, closes.shift())
    }
  })

  p.add(1)
  p.increment(1)

  p.add(2)
  p.increment(2)

  p.add(3)
  p.increment(3)

  p.add(4)

  p.increment(2)
  p.decrement(2)
  p.decrement(2)

  p.decrement(3)
  p.add(5)
  p.bump(1)
  p.add(6)

  t.same(closes.length, 0)

  t.end()
})
