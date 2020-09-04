const test = require('tape')
const raf = require('random-access-file')
const tmp = require('tmp')

const { create } = require('./helpers/create')
const { runAll } = require('./helpers/util')

const MountableHypertrie = require('..')

test('simple single-trie get', async t => {
  const { tries } = await create(1)
  const [trie] = tries

  try {
    await runAll([
      cb => trie.put('/a', 'hello', cb),
      cb => {
        trie.get('/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('simple two-trie get', async t => {
  const { tries } = await create(3)
  const [trie1, trie2, trie3] = tries

  try {
    await runAll([
      cb => trie3.put('/c', 'hello', cb),
      cb => trie2.mount('/b', trie3.key, cb),
      cb => trie1.mount('/a', trie2.key, cb),
      cb => {
        trie1.get('/a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('mounting a bad key returns an error', async t => {
  const { tries } = await create(1)
  const [trie] = tries

  try {
    await runAll([
      cb => trie.put('/a', 'hello', cb),
      cb => trie.mount('/b', 'some bad key', cb)
    ])
  } catch (err) {
    t.true(err.badKey)
    t.pass('threw an error')
    t.end()
  }
})

test('force-mounting a bad key, then reading from that mountpoint produces an error', async t => {
  const { tries } = await create(1)
  const [trie] = tries

  try {
    await runAll([
      cb => trie.put('/a', 'hello', cb),
      cb => trie.mount('/b', 'some bad key', { skipValidation: true }, cb),
      cb => trie.get('/b/c', cb)
    ])
  } catch (err) {
    t.true(err.badKey)
    t.pass('threw an error')
    t.end()
  }
})

test('versioned two-trie mount/remount', async t => {
  const { tries } = await create(2)
  const [trie1, trie2] = tries
  try {
    await runAll([
      cb => trie2.put('/c', 'hello', cb),
      cb => trie1.mount('/b', trie2.key, { version: trie2.version }, cb),
      cb => trie2.put('/d', 'goodbye', cb),
      cb => {
        trie1.get('/b/d', (err, node) => {
          t.error(err, 'no error')
          t.false(node)
          return cb(null)
        })
      },
      cb => trie1.unmount('/b', cb),
      cb => trie1.mount('/b', trie2.key, cb),
      cb => {
        trie1.get('/b/d', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('goodbye'))
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('nested versioned trie get + remount', async t => {
  const { tries } = await create(3)
  const [trie1, trie2, trie3] = tries

  try {
    await runAll([
      cb => trie3.put('/c', 'hello', cb),
      cb => trie2.mount('/b', trie3.key, { version: trie3.version }, cb),
      cb => trie1.mount('/a', trie2.key, cb),
      cb => trie3.put('/d', 'goodbye', cb),
      cb => {
        trie1.get('/a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb(null)
        })
      },
      cb => {
        trie1.get('/a/b/d', (err, node) => {
          t.error(err, 'no error')
          t.false(node)
          return cb(null)
        })
      },
      cb => trie2.unmount('/b', cb),
      cb => trie2.mount('/b', trie3.key, { version: trie3.version }, cb),
      cb => {
        trie1.get('/a/b/d', (err, node) => {
          t.error(err, 'no error')
          t.true(node)
          t.same(node.value, Buffer.from('goodbye'))
          t.end()
        })
      },
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('simple cross-trie get', async t => {
  const { tries } = await create(2)
  const [rootTrie, subTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', subTrie.key, cb),
      cb => rootTrie.put('/b', 'hello', cb),
      cb => subTrie.put('/b', 'goodbye', cb),
      cb => rootTrie.get('/a/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'a/b')
        t.same(node.value, Buffer.from('goodbye'))
        return cb(null)
      }),
      cb => rootTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'b')
        t.same(node.value, Buffer.from('hello'))
        return cb(null)
      }),
      cb => subTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'b')
        t.same(node.value, Buffer.from('goodbye'))
        return cb(null)
      })
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('simple cross-trie del', async t => {
  const { tries } = await create(2)
  const [rootTrie, subTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', subTrie.key, cb),
      cb => rootTrie.put('/b', 'hello', cb),
      cb => subTrie.put('/b', 'goodbye', cb),
      cb => rootTrie.get('/a/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'a/b')
        return cb(null)
      }),
      cb => rootTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'b')
        return cb(null)
      }),
      cb => subTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'b')
        return cb(null)
      }),
      cb => subTrie.del('/b', cb),
      cb => rootTrie.get('/a/b', (err, node) => {
        if (err) return cb(err)
        t.false(node)
        return cb(null)
      }),
      cb => rootTrie.del('/b', cb),
      cb => rootTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.false(node)
        return cb(null)
      }),
      cb => subTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.false(node)
        return cb(null)
      })
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('recursive cross-trie put/get', async t => {
  const { tries } = await create(3)
  const [rootTrie, subTrie, subsubTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', subTrie.key, cb),
      cb => subTrie.mount('/b', subsubTrie.key, cb),
      cb => rootTrie.put('/b', 'hello', cb),
      cb => subTrie.put('/c', 'dog', cb),
      cb => subTrie.put('/d', 'goodbye', cb),
      cb => subsubTrie.put('/d', 'cat', cb),
      cb => rootTrie.get('/a/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'a/d')
        t.same(node.value, Buffer.from('goodbye'))
        return cb(null)
      }),
      cb => rootTrie.get('/a/b/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'a/b/d')
        t.same(node.value, Buffer.from('cat'))
        return cb(null)
      }),
      cb => subsubTrie.get('/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'd')
        t.same(node.value, Buffer.from('cat'))
        return cb(null)
      })
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('recursive cross-trie del', async t => {
  const { tries } = await create(3)
  const [rootTrie, subTrie, subsubTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', subTrie.key, cb),
      cb => subTrie.mount('/b', subsubTrie.key, cb),
      cb => rootTrie.put('/b', 'hello', cb),
      cb => subTrie.put('/c', 'dog', cb),
      cb => subTrie.put('/d', 'goodbye', cb),
      cb => subsubTrie.put('/d', 'cat', cb),
      cb => subsubTrie.put('/e', 'walrus', cb),
      cb => subTrie.put('/c', 'potato', cb),
      cb => subTrie.put('/e', 'cat', cb),
      cb => subsubTrie.put('/f', 'horse', cb),
      cb => rootTrie.put('/d', 'calculator', cb),
      cb => rootTrie.del('/d', cb),
      cb => subsubTrie.del('/e', cb),
      cb => subTrie.del('/d', cb),
      cb => subTrie.get('/d', (err, node) => {
        if (err) return cb(err)
        t.false(node)
        return cb(null)
      }),
      cb => rootTrie.get('/a/b/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.value, Buffer.from('cat'))
        return cb(null)
      }),
      cb => subTrie.del('/b', cb),
      cb => rootTrie.get('/a/b/d', (err, node) => {
        if (err) return cb(err)
        t.false(node)
        return cb(null)
      }),
      cb => subsubTrie.get('/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node.key, 'd')
        t.same(node.value, Buffer.from('cat'))
        return cb(null)
      }),
      cb => rootTrie.get('/d', (err, node) => {
        t.error(err, 'no error')
        t.false(node)
        return cb(null)
      })
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('recursive get node references the correct sub-trie', async t => {
  const { tries } = await create(3)
  const [rootTrie, subTrie, subsubTrie] = tries

  try {
    await runAll([
      cb => rootTrie.mount('/a', subTrie.key, cb),
      cb => subTrie.mount('/b', subsubTrie.key, cb),
      cb => rootTrie.put('/b', 'hello', cb),
      cb => subTrie.put('/c', 'dog', cb),
      cb => subTrie.put('/d', 'goodbye', cb),
      cb => subsubTrie.put('/d', 'cat', cb),
      cb => rootTrie.get('/a/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node[MountableHypertrie.Symbols.TRIE].key, subTrie.key)
        return cb(null)
      }),
      cb => rootTrie.get('/a/b/d', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node[MountableHypertrie.Symbols.TRIE].key, subsubTrie.key)
        return cb(null)
      }),
      cb => rootTrie.get('/b', (err, node) => {
        if (err) return cb(err)
        t.true(node)
        t.same(node[MountableHypertrie.Symbols.TRIE].key, rootTrie.key)
        return cb(null)
      })
    ])
  } catch (err) {
    t.error(err)
  }

  t.end()
})

test('get on a checkout', async t => {
  const { tries } = await create(2)
  const [trie] = tries

  var checkout = null

  try {
    await runAll([
      cb => trie.put('/a', 'hello', cb),
      cb => {
        const version = trie.version
        checkout = trie.checkout(version)
        return cb(null)
      },
      cb => trie.del('/a', cb),
      cb => {
        trie.get('/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node, null)
          return cb(null)
        })
      },
      cb => {
        checkout.get('/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('delete a mount', async t => {
  const { tries } = await create(3)
  const [trie1, trie2, trie3] = tries

  try {
    await runAll([
      cb => trie3.put('/c', 'hello', cb),
      cb => trie2.mount('/b', trie3.key, cb),
      cb => trie1.mount('/a', trie2.key, cb),
      cb => {
        trie1.get('/a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb(null)
        })
      },
      cb => {
        trie1.unmount('/a', err => {
          t.error(err, 'no error')
          return cb(null)
        })
      },
      cb => {
        trie1.get('/a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.false(node)
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('delete a deep mount', async t => {
  const { tries } = await create(3, { sameStore: true })
  const [trie1, trie2, trie3] = tries

  try {
    await runAll([
      cb => trie3.put('/c', 'hello', cb),
      cb => trie2.mount('/b', trie3.key, cb),
      cb => trie1.mount('/a', trie2.key, cb),
      cb => {
        trie1.get('/a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb(null)
        })
      },
      cb => {
        trie1.unmount('/a/b', err => {
          t.error(err, 'no error')
          return cb(null)
        })
      },
      cb => {
        trie1.get('/a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.false(node)
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('delete a deep subdirectory within a mount', async t => {
  const { tries } = await create(3, { sameStore: true })
  const [trie1, trie2, trie3] = tries

  try {
    await runAll([
      cb => trie3.put('/c/d/e/f', 'hello', cb),
      cb => trie2.mount('/b', trie3.key, cb),
      cb => trie1.mount('/a', trie2.key, cb),
      cb => {
        trie1.get('/a/b/c/d/e/f', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb(null)
        })
      },
      cb => {
        trie1.del('/a/b/c/d/e/f', err => {
          t.error(err, 'no error')
          return cb(null)
        })
      },
      cb => {
        trie1.get('/a/b/c/d/e/f', (err, node) => {
          t.error(err, 'no error')
          t.false(node)
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('can create a cyclic mount', async t => {
  const { tries } = await create(2)
  const [trie1, trie2] = tries

  try {
    await runAll([
      cb => trie1.mount('/a', trie2.key, cb),
      cb => trie2.mount('/b', trie1.key, cb),
      cb => trie1.put('/c', 'hello', cb),
      cb => {
        trie1.get('/c', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb(null)
        })
      },
      cb => {
        trie1.get('a/b/c', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          t.end()
        })
      }
    ])
  } catch (err) {
    t.fail(err)
  }
})

test('can overwrite value at mountpoint', async t => {
  const { tries } = await create(2, { sameStore: true })
  const [trie1, trie2] = tries
  var mountNode = null

  try {
    await runAll([
      cb => trie1.mount('/a', trie2.key, { value: 'hello' }, cb),
      cb => trie2.put('/b', 'b', cb),
      cb => trie1.get('/a', (err, node) => {
        t.error(err, 'no error')
        mountNode = node
        return cb(null)
      }),
      cb => trie1.put('/a', mountNode.value, { flags: mountNode.flags }, cb),
      cb => trie1.get('/a', (err, node) => {
        t.error(err, 'no error')
        t.same(node.flags, 1)
        t.same(node.value, Buffer.from('hello'))
        return cb(null)
      }),
      cb => trie1.get('/a/b', (err, node) => {
        t.error(err, 'no error')
        t.true(node)
        if (node) t.same(node.value, Buffer.from('b'))
        t.end()
      })
    ])
  } catch (err) {
    t.fail(err)
  }
})

test.skip('deep mount reads', async t => {
  const DEPTH = 20

  const { path, cleanup } = await new Promise((resolve, reject) => {
    tmp.dir((err, path, cleanup) => {
      if (err) return reject(err)
      return resolve({ path, cleanup })
    })
  })
  console.log('path:', path)

  const storage = p => {
    return raf(path + '/' + p)
  }
  const { tries } = await create(DEPTH, { _storage: null, alwaysUpdate: false })
  const ops = []
  console.log('trie keys:', tries.map(t => t.key))

  for (let i = 1; i < DEPTH; i++) {
    ops.push(cb => tries[i - 1].mount('/' + i, tries[i].key, cb))
    ops.push(cb => tries[i - 1].put('/a', 'hello', cb))
  }
  try {
    await runAll([
      ...ops,
      /*
      cb => {
        console.time('t1')
        console.log(1)
        tries[0].get('/1/2/3/4/5/6/7/8/9/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          console.timeEnd('t1')
          return cb()
        })
      },
      cb => {
        console.time('t1')
        tries[0].get('/1/2/3/4/5/6/7/8/9/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          console.timeEnd('t1')
          return cb()
        })
      },
      cb => {
        console.time('t1')
        tries[0].get('/1/2/3/4/5/6/7/8/9/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          console.timeEnd('t1')
          return cb()
        })
      },
      */
      cb => {
        console.time('t1')
        tries[0].get('/1/a', (err, node) => {
          console.timeEnd('t1')
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb()
        })
      },
      cb => {
        console.time('t1')
        tries[0].get('/1/a', (err, node) => {
          console.timeEnd('t1')
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb()
        })
      },
      cb => {
        console.time('t1')
        tries[0].get('/1/a', (err, node) => {
          console.timeEnd('t1')
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          return cb()
        })
      },
      cb => {
        console.time('t1')
        tries[0].get('/a', (err, node) => {
          t.error(err, 'no error')
          t.same(node.value, Buffer.from('hello'))
          console.timeEnd('t1')
          return cb()
        })
      }
    ])
    //cleanup()
    t.end()
  } catch (err) {
    t.fail(err)
  }
})
