const siphash24 = require('siphash24')

module.exports = function (out, data, key) {
  siphash24(data, key, out)
}
