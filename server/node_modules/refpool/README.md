# refpool

Pool of references that gc the least recently unref'ed ones when it reaches a max size

```
npm install refpool
```

## Usage

``` js
const Pool = require('refpool')

const p = new Pool({
  maxSize: 42,
  close (data) {
    console.log('should close', data)
  }
})

const someResource = ...

p.set(key, val) // add a key to the pool
p.get(key) // get a val (bumps it) get(key, false) does not bump
p.add(data) // sugar for p.set(data, data)
const e = p.entry(key) // get the cache entry object out.
                       // you can call e.increment, decrement and bump on this direcly

p.increment(key) // add it and increment the reference count
p.decrement(key) // decrement the ref count
p.bump(key) // indicate that you used a thing in the pool
```

When more than `maxSize` items are inserted the least recently used
resource with no references will be passed to close.

## License

MIT
