var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.set('transports', [ 'websocket' ]);

clients = [];
clientCount = 0;

/*
// add a dummy client for testing purposes
clients['test_id'] = {
  'client_id' : 'test_id',
  'name' : 'Testy McTestface',
  'x' : 120,
  'y' : 100
};
*/

io.on('connection', registerClient);

function registerClient(socket) {
  // give the new client its id
  socket.emit('hello', socket.id);
  console.log('hello ' + socket.id);

  printClients(clients);

  // tell the new client about all existing clients
  for (client in clients) {
    var msg = JSON.stringify(clients[client]);
    console.log('send to ' + socket.id + ': update ' + msg);
    socket.emit('update', msg);
  }

  // register a handler for client updates
  socket.on('update', function(msg) {
    // notify all clients of the update
    var update = JSON.parse(msg);
    update.client_id = socket.id;
    clients[socket.id] = update;
    var msg = JSON.stringify(update);
    console.log('broadcast: update ' +  msg);
    io.emit('update', msg);
    //printClients(clients);
  });

  // register a handler for client disconnect
  socket.on('disconnect', function() {
    // notify all clients of the removal
    console.log('broadcast: delete ' + socket.id);
    io.emit('delete', socket.id);
    delete clients[socket.id];
    printClients(clients);
  });
};

function printClients(clients) {
  console.log('begin client list');
  for (client in clients) {
    var msg = JSON.stringify(clients[client]);
    console.log('  ' + client + ' : ' + msg);
  }
  console.log('end client list');
};

http.listen(8080, function() {
  console.log('listening on *:8080');
});
