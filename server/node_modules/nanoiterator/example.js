var nanoiterator = require('./')

var values = [1, 2, 3, 4, null]
var ite = nanoiterator({
  next: cb => process.nextTick(cb, null, values.shift())
})

ite.next(console.log) // 1
ite.next(console.log) // 2
ite.next(console.log) // 3
ite.next(console.log) // 4
ite.next(console.log) // null
