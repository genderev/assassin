var assert = require('assert');
const url = require('url');
const ws = require('ws');
const http = require('http');
const org = require("../edit.js")
let origin = url.parse(org["ORIGIN"]).host
var fs = require('fs');


describe('origin', function () {
  describe('#pathname', function () {
    it('should be /', function () {
      assert.equal(new URL("https://"+origin).pathname, "/");
    });
  });
});


describe('#handleUpgrade', () => {
    it('can be used to send messages', (done) => {
      const server = http.createServer();

      server.listen(0, () => {
        const wss = new ws.Server({ noServer: true });

        server.on('upgrade', (req, socket, head) => {
          wss.handleUpgrade(req, socket, head, (client) =>
            client.send('hello')
          );
        });

        const was = new ws(`ws://localhost:${server.address().port}`);

        was.on('message', (message) => {
          assert.strictEqual(message, 'hello');
          wss.close();
          server.close(done);
        });
      });
    });
});


describe('read file', function () {
    it('should say hi', function () {
      fs.readFile('./test/test.txt', function(err, data) {
          assert.equal("hi", data.toString().trim())
        });
    });
});
 
