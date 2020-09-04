# derived-key-storage

Derive a key and secret key file from a name.

```
npm install derived-key-storage
```

## Usage

``` js
const derivedStorage = require('derived-key-storage')
const raf = require('random-access-file')

const { key, secretKey } = derivedStorage(name => raf(name), (name, cb) => {
  // derive your keypair here ...
  // if name is null, this keypair is fresh, otherwise derive from that name
  // you can optionally return a secret key without a name, and that will be stored instead.
  cb(null, {
    name,
    publicKey,
    secretKey
  })
})

key.read(0, 32, (err, buf) => {
  console.log('public key is', err, buf)
})
```

## API

#### `{ key, secretKey } = derivedStorage(storage, deriver)`

Create a new key pair instance. Returns two random-access-storage instances, one for the public key and one for the secret key.
The storage function you pass in will be used to store the name of the keypair. The deriver function should look like this:

```
function (name, cb) {
  cb(null, {
    name,
    publicKey,
    secretKey
  })
}
```

Where `name` is a buffer or null containing the name of the keypair. If the name is null you need to return the name of the keypair
back to the callback as it still will be written along with a length prefix to the storage you pass in.

If you do not with to derive your secret key from a name, you can override the derivation by returning a secret key and a `null`
name from this function.

## License

MIT
