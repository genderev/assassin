class Assassin {
        //online - import db
        connect (wss) {
          self.socket = new WebSocket(wss);
        }
        //online - create db
        create ([key,val]){
          socket.addEventListener('open', function (event) {
              socket.send(JSON.stringify([key,val]));
          });
        }
}
killer = new Assassin();
