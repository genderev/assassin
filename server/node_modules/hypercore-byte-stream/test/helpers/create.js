const ram = require('random-access-memory')
const hypercore = require('hypercore')

const createStream = require('../..')

function createLocal (numRecords, recordSize, cb) {
  const core = hypercore(ram)

  const records = []
  for (let i = 0; i < numRecords; i++) {
    const record = Buffer.allocUnsafe(recordSize).fill(Math.floor(Math.random() * 10))
    records.push(record)
  }

  core.append(records, err => {
    if (err) return cb(err)
    const stream = createStream()
    return cb(null, core, core, stream, records)
  })
}

function createRemote (numRecords, recordSize, cb) {
  const core1 = hypercore(ram, { sparse: true })

  const records = []
  for (let i = 0; i < numRecords; i++) {
    const record = Buffer.allocUnsafe(recordSize).fill(Math.floor(Math.random() * 10))
    records.push(record)
  }

  core1.append(records, err => {
    if (err) return cb(err)

    const core2 = hypercore(ram, core1.key, { sparse: true })

    const s1 = core1.replicate(true, { live: true })
    s1.pipe(core2.replicate(false, { live: true })).pipe(s1)

    const stream = createStream()
    return cb(null, core1, core2, stream, records)
  })
}

module.exports = {
  createLocal,
  createRemote
}
