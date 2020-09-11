var express = require('express')
var cors = require('cors')
var app = express()
var hyperdrive = require('hyperdrive')
var drive = hyperdrive('./sync')
var bodyParser = require('body-parser')
var path = require('path')
app.use(cors())
app.use(bodyParser.text());


drive.writeFile('/data.txt', JSON.stringify({Thanks:"Visit gitter.im/assassindb for help!"}), function (err) {
  if (err) {throw err}
})


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
})


app.post('/', function (req, res) {
  drive.readFile('/data.txt', 'utf-8', function (err, data) {
    res.send(data)
  })

})

app.post('/write', function (req, res) {
  var writing = req.body;
  drive.unlink('/data.txt');
  drive.writeFile('/data.txt', writing, function (err) {
      if (err) throw err
  })

})

app.listen(8080)
