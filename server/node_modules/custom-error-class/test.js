const tape = require('tape')
const CustomError = require('./')

class SubClass extends CustomError {
  constructor () {
    super('ho')
  }
}

tape('instanceof Error', function (assert) {
  const e = new CustomError('hi')
  const s = new SubClass()
  assert.ok(e instanceof Error)
  assert.ok(s instanceof Error)
  assert.end()
})

tape('has message', function (assert) {
  const e = new CustomError('hi')
  const s = new SubClass()
  assert.same(e.message, 'hi')
  assert.same(s.message, 'ho')
  assert.end()
})

tape('has stack', function (assert) {
  const e = new CustomError('hi')
  const s = new SubClass()
  assert.ok(e.stack)
  assert.ok(s.stack)
  assert.end()
})
