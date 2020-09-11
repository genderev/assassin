importScripts('assassin.js')

killer.connect("https://your-server.fly.dev");

self.onmessage = function (e) {

if (e.data[0] == "c"){
  killer.create(e.data[1],e.data[2])
} else if (e.data[0] == "d"){
  killer.delete(e.data[1])
} else if (e.data[0] == "u"){
  killer.update(e.data[1],e.data[2])
}

}
