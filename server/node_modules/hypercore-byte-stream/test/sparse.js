const { createRemote } = require('./helpers/create')
const testSuite = require('./helpers/suite')

testSuite('remote', createRemote)
