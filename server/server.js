const org = require("./edit.js");
const url = require('url');
const origin = url.parse(org["ORIGIN"]).host
const hyperdrive = require('hyperdrive')
const drive = hyperdrive('./sync')

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {

  
  drive.readFile('/data.txt', 'utf-8', function (err, data) {
      let contents = data
      ws.send(contents);
      });


  ws.on('message', function incoming(message) {
     drive.readFile('/data.txt', 'utf-8', function (err, data) {
          if (err) throw err
        drive.writeFile('/data.txt',data + message, function (err) {
            if (err) throw err
          })
      })
  });

});
