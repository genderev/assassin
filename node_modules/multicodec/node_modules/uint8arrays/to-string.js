'use strict'

const { names } = require('multibase/src/constants')
const { TextDecoder } = require('web-encoding')
const utf8Decoder = new TextDecoder('utf8')

/**
 * Turns a `Uint8Array` into a string.
 *
 * Supports `utf8` and any encoding supported by the multibase module
 *
 * @param {Uint8Array} buf The array to turn into a string
 * @param {String} [encoding=utf8] The encoding to use
 * @returns {String}
 * @see {@link https://www.npmjs.com/package/multibase|multibase} for supported encodings other than `utf8`
 */
function toString (buf, encoding = 'utf8') {
  if (encoding === 'utf8' || encoding === 'utf-8') {
    return utf8Decoder.decode(buf)
  }

  const codec = names[encoding]

  if (!codec) {
    throw new Error('Unknown base')
  }

  return codec.encode(buf)
}

module.exports = toString
