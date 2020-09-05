class Assassin {
        //online - import db
        connect (wss) {
          self.socket = new WebSocket(wss);
          socket.addEventListener('message', function (event) {
              console.log('Message from server ', event.data);
               // self.database = JSON.parse(event.data);
          });
        }

        read(){
          return database
        }

        update(){
          //is database an object or array?
          //get database
          //needs to understand format of database more
        }

        delete(key){
          //get database
          //if database is JSON:
          //delete database.key

        }
        //online - create db
        create (key,val){

		obj = {
		    key: key,
		    val: val,
		    // ...other properties
		  };

		  console.log(obj)
          // database.push(obj)
          // socket.send(JSON.stringify(database));
        }
}
killer = new Assassin();
