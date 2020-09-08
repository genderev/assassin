importScripts('assassin.js')

killer.connect("https://dark-frost-473.fly.dev");

self.postMessage(database)

self.onmessage = function (e) {

if (e.data[0] == "c"){
  killer.create(e.data[1],e.data[2])
  self.postMessage(database)
} else if (e.data[0] == "d"){
  killer.delete(e.data[1])
  self.postMessage(database)
} else if (e.data[0] == "u"){
  killer.update(e.data[1],e.data[2])
  self.postMessage(database)
}

}
