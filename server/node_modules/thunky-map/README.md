# thunky-map

A map version of [thunky](https://github.com/mafintosh/thunky)

```
npm install thunky-map
```

## Usage

``` js
const ThunkyMap = require('thunky-map')

const m = new ThunkyMap(function (key, cb) {
  // load the resource async
  // only ran once per key
  setTimeout(function () {
    cb(null, key)
  }, 1000)
})

// triggers the load function above
m.get('hi', function (err, val) {
  // ...
})

// does not as it's already running
m.get('hi', function (err, val) {
  // ...
})
```

## API

#### `m = new ThunkyMap(load)`

Make a new ThunkyMap instance. load should be a function taking a key and callback argument
and should return a value.

#### `m.get(key, cb)`

Get a key. Triggers the load if the key hasn't been loaded before.

#### `m.delete(key)`

Delete a value

#### `m.has(key)`

Check if the map has a value

## License

MIT
