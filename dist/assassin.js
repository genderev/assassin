class Assassin {

    connect(url){
    self.addr = url.toString()
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    self.database = JSON.parse(xhr.responseText)
    }


    update(k,val){

    var key = k;
      for (var i = 0; i < database.length; i++) {
      database[i][key] = val
      }
    var xhr = new XMLHttpRequest();
    xhr.open("POST", addr, true);
    xhr.send(JSON.stringify(database));
    }

    delete(key){
      for (var i = 0; i < database.length; i++) {
       delete database[i][key]
      }
      var xhr = new XMLHttpRequest();
      xhr.open("POST", addr, true);
      xhr.send(JSON.stringify(database));
    }

    create (k,val){
    var key = k;
    var obj = {};
    obj[key] = val;
    database.push(obj);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", addr, true);
    xhr.send(JSON.stringify(database));
    }

}
killer = new Assassin();
