const { createLocal } = require('./helpers/create')
const testSuite = require('./helpers/suite')

testSuite('local', createLocal)
