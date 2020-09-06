importScripts('assassin.js')

killer.connect("https://dark-frost-473.fly.dev");
// ⬆︎ DO NOT USE THIS SERVER IN PRODUCTION! This is a test server made for the demo. ⬆


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
