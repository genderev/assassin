var express = require('express')
var cors = require('cors')
var app = express()
var hyperdrive = require('hyperdrive')
var drive = hyperdrive('./sync')
var bodyParser = require('body-parser')
app.use(cors())
app.use(bodyParser.text());


drive.writeFile('/hello.txt', JSON.stringify([{'Thanks': 'Visit gitter.im/assassindb for help!'}]), function (err) {
  if (err) {throw err}
})


app.get('/', function (req, res) {
  drive.readFile('/hello.txt', 'utf-8', function (err, data) {
    if (err) {throw err};
    res.send(data)
  })

})
app.post('/', function (req, res) {

  var writing = req.body;

  drive.unlink('/hello.txt');
  drive.writeFile('/hello.txt', writing, function (err) {
      if (err) throw err
  })


})

app.listen(8080)
