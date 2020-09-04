const ThunkyMap = require('./')

const t = new ThunkyMap(function (key, cb) {
  console.log('loading...', key)
  setTimeout(() => cb(null, key), key)
})

t.get(1000, console.log)
t.get(100, console.log)

setTimeout(function () {
  t.get(1000, console.log)
}, 2000)
