importScripts('assassin.js')

self.onmessage = function (message) {

killer.track(message.data[0],message.data[1])

killer.archive()

}
