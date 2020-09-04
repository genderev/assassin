var sodium = require('sodium-native')
var assert = require('nanoassert')

var DHLEN = sodium.crypto_scalarmult_BYTES
var PKLEN = sodium.crypto_scalarmult_BYTES
var SKLEN = sodium.crypto_scalarmult_SCALARBYTES
var SEEDLEN = sodium.crypto_kx_SEEDBYTES

module.exports = {
  DHLEN,
  PKLEN,
  SKLEN,
  SEEDLEN,
  generateKeypair,
  generateSeedKeypair,
  dh
}

function generateKeypair (pk, sk) {
  assert(pk.byteLength === PKLEN)
  assert(sk.byteLength === SKLEN)
  sodium.crypto_kx_keypair(pk, sk)
}

function generateSeedKeypair (pk, sk, seed) {
  assert(pk.byteLength === PKLEN)
  assert(sk.byteLength === SKLEN)
  assert(seed.byteLength === SKLEN)

  sodium.crypto_kx_seed_keypair(pk, sk, seed)
}

function dh (output, lsk, pk) {
  assert(output.byteLength === DHLEN)
  assert(lsk.byteLength === SKLEN)
  assert(pk.byteLength === PKLEN)

  sodium.crypto_scalarmult(
    output,
    lsk,
    pk
  )
}
