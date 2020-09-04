const { promisify } = require('util')
const Corestore = require('corestore')
const ram = require('random-access-memory')

const MountableHypertrie = require('../..')

module.exports.create = async function (numTries, opts = {}) {
  const sparse = true
  const ifAvailable = true

  const tries = []
  const stores = []

  if (opts.sameStore) {
    var mainStore = new Corestore((opts && opts._storage) || ram, { sparse, ifAvailable })
  }

  for (let i = 0; i < numTries; i++) {
    const store = mainStore ? mainStore : new Corestore((opts && opts._storage) || ram, { sparse, ifAvailable })
    await store.ready()
    const feed = store.get()
    const trie = new MountableHypertrie(store, null, { ...opts, sparse, feed })
    await promisify(trie.ready.bind(trie))()
    tries.push(trie)
    stores.push(store)
  }

  const streams = replicateAll(tries, { sparse, live: true })

  return { tries, stores, streams }
}

function replicateAll (tries, opts) {
  const streams = []
  const replicated = new Set()

  for (let i = 0; i < tries.length; i++) {
    for (let j = 0; j < tries.length; j++) {
      if (i === j || replicated.has(j)) continue
      const source = tries[i]
      const dest = tries[j]

      const s1 = source.replicate(true, { ...opts })
      const s2 = dest.replicate(false, { ...opts })
      streams.push([s1, s2])

      s1.pipe(s2).pipe(s1)
    } replicated.add(i)
  }
  return streams
}
