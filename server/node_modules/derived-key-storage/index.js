const RAS = require('random-access-storage')
const thunky = require('thunky')
const varint = require('varint')

module.exports = keyPair

function keyPair (storage, derive) {
  const keyStorage = storage('key')
  const nameStorage = storage('name')
  const secretKeyStorage = storage('secret_key')

  const load = thunky(function (cb) {
    keyStorage.read(0, 32, (err, key) => {
      if (err) return createNew()
      readName((err, name) => {
        if (err) return cb(err)
        if (name) return derive(name, cb)
        secretKeyStorage.read(0, 64, (err, secretKey) => {
          if (err) return cb(null, { publicKey: key, secretKey: null, name: null })
          return cb(null, { publicKey: key, secretKey, name: null })
        })
      })
    })

    function readName (cb) {
      nameStorage.stat((err, st) => {
        if (err) return cb(null, null)
        if (st.size < 2) return cb(null, null)

        nameStorage.read(0, st.size, (err, buf) => {
          if (err) return cb(err, null)
          let len = 0

          try {
            len = varint.decode(buf, 0)
          } catch (err) {
            return cb(null, null)
          }

          const offset = varint.decode.bytes
          if (offset + len !== buf.length) return cb(null, null)
          const name = buf.slice(offset)
          return cb(null, name)
        })
      })
    }

    function writeName (name, cb) {
      if (!name) return cb(null)
      const buf = Buffer.allocUnsafe(varint.encodingLength(name.length) + name.length)
      varint.encode(name.length, buf, 0)
      name.copy(buf, varint.encode.bytes)
      nameStorage.write(0, buf, cb)
    }

    function createNew () {
      derive(null, (err, res) => {
        if (err) return cb(err)
        keyStorage.write(0, res.publicKey, err => {
          if (err) return cb(err)
          if (res.name) return writeName(res.name, done)
          else if (res.secretKey) return secretKeyStorage.write(0, res.secretKey, done)
          else return done(new Error('The derivation function did not provide a name or a secret key.'))
        })

        function done (err) {
          if (err) return cb(err)
          return cb(null, res)
        }
      })
    }
  })

  const key = new RAS({
    stat (req) {
      load((err, res) => {
        if (err) return req.callback(err)
        req.callback(null, { size: 32 })
      })
    },
    read (req) {
      load((err, res) => {
        if (err) return req.callback(err)
        req.callback(null, res.publicKey)
      })
    },
    close (req) {
      keyStorage.close(err => req.callback(err))
    }
  })

  const secretKey = new RAS({
    stat (req) {
      load((err, res) => {
        if (err) return req.callback(err)
        if (!res.secretKey) return req.callback(new Error('No secret key.'))
        req.callback(null, { size: 64 })
      })
    },
    read (req) {
      load((err, res) => {
        if (err) return req.callback(err)
        if (!res.secretKey) return req.callback(new Error('No secret key.'))
        req.callback(null, res.secretKey)
      })
    },
    close (req) {
      nameStorage.close(err => req.callback(err))
    }
  })

  return { key, secretKey }
}
