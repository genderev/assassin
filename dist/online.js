importScripts('assassin.js')


killer.connect("wss://www.example.com")

self.onmessage = function (message) {


killer.create(message.data[0],message.data[1])

}
