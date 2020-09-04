# is-options

Easily check if input is an options map

```
npm install is-options
```

[![Build Status](https://travis-ci.org/mafintosh/is-options.svg?branch=master)](https://travis-ci.org/mafintosh/is-options)

## Usage

``` js
var isOptions = require('is-options')

thing('', {foo: true}) // key='', opts={foo: true}
thing({foo: true}) // key=undefined, opts={foo: true}
thing(Buffer.from('buf'), {foo: true}) // key=Buffer('buf'), opts={foo: true}

function thing (optionalKey, opts) {
  if (isOptions(optionalKey) {
    opts = optionalKey
    optionalKey = undefined
  }

  console.log('key', optionalKey)
  console.log('options', opts)
}
```

## API

#### `bool = isOptions(obj)`

Returns true is `obj` is an object and not a buffer

## License

MIT
