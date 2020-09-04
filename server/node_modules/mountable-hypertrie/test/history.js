const test = require('tape')

const { create } = require('./helpers/create')
const { runAll } = require('./helpers/util')

test.skip('two-trie history', async t => {
  const { tries } = await create(2)
  const [trie1, trie2] = tries

  const expected1 = [['c', 'c'], ['d', 'd']]
  const expected2 = [['a', 'aa'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'], ['f', 'f']]
  const expected3 = [['a', trie2.key ], ['c', 'c']]
  var ite1, ite2, ite3

  try {
    await runAll([
      cb => trie2.put('a', 'a', cb),
      cb => trie2.put('a', 'aa', cb),
      cb => trie2.put('b', 'b', cb),
      cb => trie2.put('c', 'c', cb),
      cb => trie2.put('d', 'd', cb),
      cb => trie2.put('e', 'e', cb),
      cb => trie2.put('f', 'f', cb),
      cb => trie1.mount('a', trie2.key, cb),
      cb => trie1.put('c', 'c', cb),
      cb => {
        ite1 = trie2.history({ gt: 3, lte: 5 })
        ite2 = trie2.history({ gt: 1 })
        ite3 = trie1.history()
        return process.nextTick(cb, null)
      },
      cb => validate(t, ite1, expected1, cb),
      cb => validate(t, ite2, expected2, cb),
      cb => validate(t, ite3, expected3, cb)
    ])
  } catch (err) {
    t.fail(err)
  }

  t.end()
})

function validate (t, ite, expectedArr, cb) {
  var i = 0
  ite.next(function loop (err, entry) {
    if (err) return cb(err)
    if (!entry && (i !== expectedArr.length)) return cb(new Error('The history iterator did not return the expected number of entries.'))
    if (!entry) return cb(null)

    const expected = expectedArr[i++]
    const { node, type, info } = entry

    if (type === 'mount') {
      t.same(info.key, expected[1])
    } else if (type === 'put') {
      t.same(node.key, expected[0])
      t.same(node.value, Buffer.from(expected[1]))
    } else {
      return cb(new Error('Invalid entry type.'))
    }

    return ite.next(loop)
  })
}
