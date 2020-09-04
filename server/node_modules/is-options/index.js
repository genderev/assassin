module.exports = isOptions

function isOptions (opts) {
  return typeof opts === 'object' && opts && !Buffer.isBuffer(opts)
}
