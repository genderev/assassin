const hyperdrive = require('hyperdrive')
const drive = hyperdrive('./sync')

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {

  
  drive.readFile('/data.txt', 'utf-8', function (err, data) {

      if(typeof data==object||typeof data==string){
        ws.send(data);
        ws.send(typeof data);

      }else{
        let nice = JSON.stringify({Thanks:"Visit https://gitter.im/assassindb for help."})
        ws.send(nice);

      }

        
      
      });


  ws.on('message', function incoming(message) {
    drive.unlink("/data.txt");
        drive.writeFile('/data.txt',message, function (err) {
            if (err){throw err} 
          });

         drive.readFile('/data.txt', 'utf-8', function (err, data) {
      ws.send(data); 
     });

      })

   


});
