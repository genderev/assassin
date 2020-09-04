# nanoiterator

Lightweight and efficient iterators

```
npm install nanoiterator
```

[![build status](https://travis-ci.org/mafintosh/nanoiterator.svg?branch=master)](https://travis-ci.org/mafintosh/nanoiterator)

## Usage

``` js
var nanoiterator = require('nanoiterator')

var values = [1, 2, 3, 4, null]
var ite = nanoiterator({
  next: cb => process.nextTick(cb, null, values.shift())
})

ite.next(console.log) // 1
ite.next(console.log) // 2
ite.next(console.log) // 3
ite.next(console.log) // 4
ite.next(console.log) // null
```

## API

#### `var ite = nanoiterator([options])`

Create a new iterator.

Options include:

``` js
{
  open: cb => cb(null), // sets ._open
  next: cb => cb(null, nextValue), // sets ._next
  destroy: cb => cb(null) // sets ._destroy
}
```

#### `ite.next(callback)`

Call this function to get the next value from the iterator. It is same to call this
method as many times as you want without waiting for previous calls to finish.

#### `ite._next(callback)`

Overwrite this function to your own iteration logic.

Call `callback(null, nextValue)` when you have a new value to return, or
call `callback(null, null)` if you want to signal that the iterator has ended.

No matter how many times a user calls `.next(cb)` only *one* `_next` call will
run at the same time.

#### `ite._open(callback)`

Optionally overwrite this method with your own open logic.

Called the first time `._next` is called and is run before the `_next` call runs.

#### `ite._destroy(callback)`

Optionally overwrite this method with your own destruction logic.

Called once when a user calls `.destroy(cb)` and all subsequent `.next()` calls
will result in an error.

#### `ite.ended`

Signals if the iterator has been ended (`_next` has returned `(null, null)`).

#### `ite.opened`

Signals if the iterator has been fully opened.

#### `ite.closed`

Signals if the iterator has been destroyed.

## Iterator to Node.js Stream

If you want to convert the iterator to a readable Node.js stream you can use the
`require('nanoiterator/to-stream')` helper.

``` js
var toStream = require('nanoiterator/to-stream')
var stream = toStream(iterator)

stream.on('data', function (data) {
  // calls .next() behind the scene and pushes it to the stream.
})
```

## License

MIT
