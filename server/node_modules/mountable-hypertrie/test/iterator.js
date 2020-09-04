const test = require('tape')

const { create } = require('./helpers/create')
const { runAll } = require('./helpers/util')

const MountableHypertrie = require('..')


test('simple single-trie iterator', async t => {
  const { tries } = await create(1)
  const [rootTrie] = tries

  const vals = ['a', 'b', 'c']
  const expected = toMap(vals)

  try {
    await put(rootTrie, vals)
    await runAll([
      cb => {
        all(rootTrie.iterator(), (err, map) => {
          t.error(err, 'no error')
          t.same(map, expected, 'iterated all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('one-level nested iterator', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, dTrie] = tries

  const vals = ['a', 'b', 'c', 'd', 'a/a', 'a/b', 'd/e', 'd/f']
  const expected = toMap(vals)

  try {
    await put(rootTrie, ['b', 'c'])
    await put(aTrie, ['a', 'b'], 'a/')
    await put(dTrie, ['e', 'f'], 'd/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => rootTrie.mount('d', dTrie.key, { value: 'd' }, cb),
      cb => {
        all(rootTrie.iterator({ recursive: true }), (err, map) => {
          t.error(err, 'no error')
          t.same(map, expected, 'iterated all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('multi-level nested iterator', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, abTrie] = tries

  const vals = ['a', 'b', 'c', 'a/a', 'a/b', 'a/b/c', 'a/b/d', 'a/c', 'e']
  const expected = toMap(vals)

  try {
    await put(rootTrie, ['b', 'c', 'e'])
    await put(aTrie, ['a', 'c'], 'a/')
    await put(abTrie, ['c', 'd'], 'a/b/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => aTrie.mount('b', abTrie.key, { value: 'a/b' }, cb),
      cb => {
        all(rootTrie.iterator({ recursive: true }), (err, map) => {
          t.error(err, 'no error')
          t.same(map, expected, 'iterated all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('iteration without mounts', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, abTrie] = tries

  const vals = ['b', 'c', 'e', 'b/c', 'b/d', 'a']
  const expected = toMap(vals)

  try {
    await put(rootTrie, ['b', 'c', 'e'])
    await put(rootTrie, ['b/c', 'b/d'])
    await put(aTrie, ['a', 'c'], 'a/')
    await put(abTrie, ['c', 'd'], 'a/b/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => aTrie.mount('b', abTrie.key, { value: 'a/b' }, cb),
      cb => {
        all(rootTrie.iterator({ recursive: true, noMounts: true }), (err, map) => {
          t.error(err, 'no error')
          t.same(map, expected, 'iterated all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('list iterator', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, abTrie] = tries

  const vals = ['a', 'b', 'c', 'a/a', 'a/b', 'a/b/c', 'a/b/d', 'a/c', 'e']
  const expected = toMap(vals)

  try {
    await put(rootTrie, ['b', 'c', 'e'])
    await put(aTrie, ['a', 'c'], 'a/')
    await put(abTrie, ['c', 'd'], 'a/b/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => aTrie.mount('b', abTrie.key, { value: 'a/b' }, cb),
      cb => {
        rootTrie.list({ recursive: true }, (err, l) => {
          t.error(err, 'no error')
          const res = l.reduce((acc, node) => { acc[node.key] = node.value.toString('utf8'); return acc }, {})
          t.same(res, expected, 'listed all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('iterator nodes reference correct sub-tries', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, abTrie] = tries

  const expected = {
    'a': rootTrie.key,
    'b': rootTrie.key,
    'c': rootTrie.key,
    'e': rootTrie.key,
    'a/a': aTrie.key,
    'a/b': aTrie.key,
    'a/c': aTrie.key,
    'a/b/c': abTrie.key,
    'a/b/d': abTrie.key
  }

  try {
    await put(rootTrie, ['b', 'c', 'e'])
    await put(aTrie, ['a', 'c'], 'a/')
    await put(abTrie, ['c', 'd'], 'a/b/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => aTrie.mount('b', abTrie.key, { value: 'a/b' }, cb),
      cb => {
        rootTrie.list({ recursive: true }, (err, l) => {
          t.error(err, 'no error')
          const res = l.reduce((acc, node) => {
            acc[node.key] = node[MountableHypertrie.Symbols.TRIE].key
            return acc
          }, {})
          t.same(res, expected, 'trie references are all correct')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('non-recursive cross-trie iterator with gt opt', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, abTrie] = tries

  const aVals = ['a/.key', 'a/b', 'a/c']
  const abVals = ['a/b/c', 'a/b/d']
  const aExpected = toMap(aVals)
  const abExpected = toMap(abVals)

  try {
    await put(rootTrie, ['b', 'c', 'e'])
    await put(aTrie, ['.key', 'c'], 'a/')
    await put(abTrie, ['c', 'd'], 'a/b/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => aTrie.mount('b', abTrie.key, { value: 'a/b' }, cb),
      cb => {
        rootTrie.list('a', { recursive: false, gt: true }, (err, l) => {
          t.error(err, 'no error')
          const res = l.reduce((acc, node) => { acc[node.key] = node.value.toString('utf8'); return acc }, {})
          t.same(res, aExpected, 'listed all values')
          return cb(null)
        })
      },
      cb => {
        rootTrie.list('a/b', { recursive: false, gt: true }, (err, l) => {
          t.error(err, 'no error')
          const res = l.reduce((acc, node) => { acc[node.key] = node.value.toString('utf8'); return acc }, {})
          t.same(res, abExpected, 'listed all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('iterator fully enclosed by mount', async t => {
  const { tries } = await create(3)
  const [rootTrie, aTrie, dTrie] = tries

  const vals = ['a/a', 'a/b']
  const expected = toMap(vals)

  try {
    await put(rootTrie, ['b', 'c'])
    await put(aTrie, ['a', 'b'], 'a/')
    await put(dTrie, ['e', 'f'], 'd/')
    await runAll([
      cb => rootTrie.mount('a', aTrie.key, { value: 'a' }, cb),
      cb => rootTrie.mount('d', dTrie.key, { value: 'd' }, cb),
      cb => {
        all(rootTrie.iterator('a'), (err, map) => {
          t.error(err, 'no error')
          t.same(map, expected, 'iterated all values')
          return cb(null)
        })
      }
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('in-memory mount iterator', async t => {
  const { tries } = await create(5)
  const [rootTrie, aTrie, bTrie, cTrie, abTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', aTrie.key, cb),
      cb => rootTrie.mount('/b', bTrie.key, cb),
      cb => rootTrie.mount('/c', cTrie.key, cb),
      cb => aTrie.mount('/b', abTrie.key, cb),
      cb => abTrie.put('hello', 'world', cb),
      cb => aTrie.get('b/hello', cb),
      cb => validate(cb)
    ])
  } catch (err) {
    t.fail(err)
  }

  t.end()

  function validate (cb) {
    rootTrie.listMounts({ memory: true }, (err, vals) => {
      t.error(err, 'no error')
      t.same(vals.length, 3)
      aTrie.listMounts({ memory: true }, (err, vals) => {
        t.error(err, 'no error')
        t.same(vals.length, 1)
        t.same(vals[0].path, '/b')
        return cb(null)
      })
    })
  }
})

test('non-recursive mount iterator', async t => {
  const { tries } = await create(5)
  const [rootTrie, aTrie, bTrie, cTrie, abTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', aTrie.key, cb),
      cb => rootTrie.mount('/b', bTrie.key, cb),
      cb => rootTrie.mount('/c', cTrie.key, cb),
      cb => aTrie.mount('/b', abTrie.key, cb),
      cb => abTrie.put('hello', 'world', cb),
      cb => aTrie.get('b/hello', cb),
      cb => validate(cb)
    ])
  } catch (err) {
    t.fail(err)
  }

  t.end()

  function validate (cb) {
    rootTrie.listMounts((err, vals) => {
      t.error(err, 'no error')
      t.same(vals.length, 3)
      aTrie.listMounts((err, vals) => {
        t.error(err, 'no error')
        t.same(vals.length, 1)
        t.same(vals[0].path, '/b')
        return cb(null)
      })
    })
  }
})

test('recursive mount iterator', async t => {
  const { tries } = await create(5)
  const [rootTrie, aTrie, bTrie, cTrie, abTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', aTrie.key, cb),
      cb => rootTrie.mount('/b', bTrie.key, cb),
      cb => rootTrie.mount('/c', cTrie.key, cb),
      cb => aTrie.mount('/b', abTrie.key, cb),
      cb => abTrie.put('hello', 'world', cb),
      cb => aTrie.get('b/hello', cb),
      cb => validate(cb)
    ])
  } catch (err) {
    t.fail(err)
  }

  t.end()

  function validate (cb) {
    rootTrie.listMounts({ recursive: true }, (err, vals) => {
      t.error(err, 'no error')
      t.same(vals.length, 4)
      const expected = new Set(['/a', '/b', '/c', '/a/b'])
      for (const val of vals) {
        t.true(expected.has(val.path))
        expected.delete(val.path)
      }
      return cb(null)
    })
  }
})

// Duplicated from hypertrie.
function toMap (list) {
  const map = {}
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = list[i]
  }
  return map
}

function all (ite, cb) {
  const vals = {}

  ite.next(function loop (err, node) {
    if (err) return cb(err)
    if (!node) return cb(null, vals)
    const key = Array.isArray(node) ? node[0].key : node.key
    if (vals[key]) return cb(new Error('duplicate node for ' + key))
    vals[key] = Array.isArray(node) ? node.map(n => n.value.toString('utf8')).sort() : node.value.toString('utf8')
    ite.next(loop)
  })
}

function put (trie, vals, prefix = '') {
  return runAll(vals.map(v => (cb) => trie.put(v, prefix + v, cb)))
}
