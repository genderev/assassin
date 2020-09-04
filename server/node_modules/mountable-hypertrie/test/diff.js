const test = require('tape')

const { create } = require('./helpers/create')
const { runAll } = require('./helpers/util')

test('two-trie diff', async t => {
  const { tries } = await create(3)
  const [trie1, trie2, trie3] = tries

  const expected1 = [
    { type: 'put', key: 'a/f', left: { value: 'f' }},
    { type: 'put', key: 'a/d', left: { value: 'aa' }},
  ]
  const expected2 = [
    { type: 'put', key: 'a/f', left: { value: 'f' }, right: { value: 'a' }},
    // TODO: The next value appears in practice, and is a false positive.
    { type: 'put', key: 'a/d', left: { value: 'aa' }, right: { value: 'aa' }},
    { type: 'del', key: 'b', right: { value: 'b' }},
  ]
  const expected3 = [
    { type: 'mount', key: 'a', left: { info: { key: trie2.key }}},
  ]
  const expected4 = [
    { type: 'unmount', key: 'a' },
  ]

  var ite1, ite2, ite3, ite4
  var v1, v2, v3, v4

  try {
    await runAll([
      cb => trie2.put('a/f', 'a', cb),
      cb => trie2.put('a/d', 'aa', cb),
      cb => trie2.put('b', 'b', cb),
      cb => {
        v1 = trie2.version
        return process.nextTick(cb, null)
      },
      cb => trie2.del('b', cb),
      cb => trie2.put('a/f', 'f', cb),
      cb => trie1.mount('a', trie2.key, cb),
      cb => {
        v2 = trie1.version
        return process.nextTick(cb, null)
      },
      cb => trie1.unmount('a', cb),
      cb => {
        v3 = trie1.version
        return process.nextTick(cb, null)
      },
      cb => trie1.put('e', 'f', cb),
      cb => {
        ite1 = trie2.diff(0, '/')
        ite2 = trie2.diff(trie2.checkout(v1), '/')
        ite3 = trie1.checkout(v2).diff(0)
        ite4 = trie1.checkout(v3).diff(v2, '/')
        return process.nextTick(cb, null)
      },
      cb => validate(t, ite1, expected1, cb),
      cb => validate(t, ite2, expected2, cb),
      cb => validate(t, ite3, expected3, cb),
      cb => validate(t, ite4, expected4, cb)
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
    if (!entry && (i !== expectedArr.length)) return cb(new Error('The diff iterator did not return the expected number of entries.'))
    if (!entry) return cb(null)

    const expected = expectedArr[i++]
    const { type, key, left, right } = entry
    const { type: expectedType, key: expectedKey, left: expectedLeft, right: expectedRight } = expected

    t.same(key, expectedKey)
    if (type === 'mount' || type === 'unmount') {
      if (expectedRight) {
        t.same(expectedRight.info.key, right.info.key)
      }
      if (expectedLeft) {
        t.same(expectedLeft.info.key, left.info.key)
      }
    } else if (type === 'put' || type === 'del') {
      if (expectedRight) {
        t.same(Buffer.from(expectedRight.value), right.value)
      }
      if (expectedLeft) {
        t.same(Buffer.from(expectedLeft.value), left.value)
      }
    } else {
      return cb(new Error('Invalid entry type.'))
    }

    return ite.next(loop)
  })
}
