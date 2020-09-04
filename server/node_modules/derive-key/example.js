const derive = require('./')

const ns = 'test'
const input = 'google.com'
const masterKey = Buffer.alloc(32)

const out = derive(ns, masterKey, input)

console.log(out)
