const raf = require('random-access-file')
const hypercore = require('hypercore')
const hypercoreCrypto = require('hypercore-crypto')
const derive = require('derive-key')
const derivedStorage = require('.')

const masterKey = Buffer.alloc(32)

const storage = name => raf(name, { directory: './tmp' })
const { key, secretKey } = derivedStorage(storage, (name, cb) => {
  console.log('name:', name)
  if (!name) name = hypercoreCrypto.randomBytes(32)
  const seed = derive('hypercore', masterKey, name)
  const { publicKey, secretKey } = hypercoreCrypto.keyPair(seed)
  return cb(null, { name, publicKey, secretKey })
})

const core = hypercore(p => {
  if (p === 'key') return key
  if (p === 'secret') return secretKey
  return storage(p)
})
core.on('ready', () => console.log('ready'))
core.on('error', (err) => console.log('error', err))
