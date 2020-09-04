var sodium = require('sodium-native')
var assert = require('nanoassert')

var HASHLEN = 64
var BLOCKLEN = 128
var scratch = sodium.sodium_malloc(BLOCKLEN * 3)
var HMACKey = scratch.subarray(BLOCKLEN * 0, BLOCKLEN * 1)
var OuterKeyPad = scratch.subarray(BLOCKLEN * 1, BLOCKLEN * 2)
var InnerKeyPad = scratch.subarray(BLOCKLEN * 2, BLOCKLEN * 3)

// Post-fill is done in the cases where someone caught an exception that
// happened before we were able to clear data at the end
module.exports = function hmac (out, data, key) {
  assert(out.byteLength === HASHLEN)
  assert(key.byteLength != null)
  assert(Array.isArray(data) ? data.every(d => d.byteLength != null) : data.byteLength != null)

  if (key.byteLength > BLOCKLEN) {
    sodium.crypto_generichash(HMACKey.subarray(0, HASHLEN), key)
    sodium.sodium_memzero(HMACKey.subarray(HASHLEN))
  } else {
    // Covers key <= BLOCKLEN
    HMACKey.set(key)
    sodium.sodium_memzero(HMACKey.subarray(key.byteLength))
  }

  for (var i = 0; i < HMACKey.byteLength; i++) {
    OuterKeyPad[i] = 0x5c ^ HMACKey[i]
    InnerKeyPad[i] = 0x36 ^ HMACKey[i]
  }
  sodium.sodium_memzero(HMACKey)

  sodium.crypto_generichash_batch(out, [InnerKeyPad].concat(data))
  sodium.sodium_memzero(InnerKeyPad)
  sodium.crypto_generichash_batch(out, [OuterKeyPad].concat(out))
  sodium.sodium_memzero(OuterKeyPad)
}

module.exports.BYTES = HASHLEN
module.exports.KEYBYTES = BLOCKLEN
