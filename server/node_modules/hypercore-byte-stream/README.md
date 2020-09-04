# hypercore-byte-stream
[![Build Status](https://travis-ci.com/andrewosh/hypercore-byte-stream.svg?branch=master)](https://travis-ci.com/andrewosh/hypercore-byte-stream)

A Readable stream wrapper around Hypercore that supports reading byte ranges.

When provided with optional start/end block heuristics, this module will efficiently sync only those blocks which contain the specified range.

Supports asynchronously specifying stream options, as well as the input feed, to remove the need for additional stream management modules like `duplexify`.

Most of the code has been extracted from [Hyperdrive](https://github.com/mafintosh/hyperdrive).

## Usage
The following example will return a byte stream of the entire input feed.
```js
const ram = require('random-access-memory')
const hypercore = require('hypercore')
const createByteStream = require('hypercore-byte-stream')

let core = hypercore(ram)
let stream = createByteStream({
  feed: core
})
```

## API
### `stream = createStream([options])`
Creates a new byte stream.

If specified, options can include:
```js
{
  feed: core, // A hypercore.
  byteOffset: 0, // Starting offset in bytes from the start of the feed.
  byteLength: 10, // The number of bytes to read.
  blockOffset: 0, // An optional starting block heuristic (optimization).
  blockLength: 10 // An optional block length that should contain the entire range (optimization).
}
```

### `stream.start([options])`
Starts downloading and streaming according to the specified options.

Options are the same as in `createStream`. If a `feed` was specified in the stream constructor, then one should *not* provide
another stream in the `start` options.

## License
MIT
