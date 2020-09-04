# derive-key

Derive a named key from a high-entropy master key

```
npm install derive-key
```

## Usage

``` js
const derive = require('derive-key')
const masterKey = crypto.randomBytes(32) // make sure this is high-entropy master key, eg. from a CSPRNG

const key = derive('a namespace', masterKey, 'my-named-key')

console.log('the derived key is:', key)
```

## API

#### `outputKey = derive(namespace, masterKey, name, [outputKey])`

Derive a named key from a 32 byte high-entropy master key. This can be 32-bytes of
cryptographically secure randomness, eg from a CSPRNG. Do **NOT** use low entropy
soruces such a passwords, passphrases or randomness from a predictable RNG.

The namespace should be an ascii string (fx your application name) and name can be a buffer
or string reflecting the name of the key you want to derive.

Optionally you can pass in the output key parameter and the result will be written into this
buffer instead of a new buffer being allocated internally.

## License

MIT
