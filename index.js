var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.set('transports', [ 'websocket' ]);

clients = [];

io.on('connection', registerClient);

function registerClient(socket) {
  // give the new client its id
  socket.emit('hello', socket.id);
  console.log('hello ' + socket.id);

  // register a handler for client join
  socket.on("join", function(msg) {
    console.log("join: " + msg);

    var join = JSON.parse(msg);

    if (!join.name) {
      var error = 'no name specified, join : ' + msg;
      console.log(error);
      socket.emit('error', error);
      return;
    }

    if (!join.session) {
      var error = 'no session specified, join : ' + msg;
      console.log(error);
      socket.emit("error", error);
      return;
    }

    var player = {
      name : join.name,
      session : join.session,
      client_id : socket.id,
    };

    clients[socket.id] = player;

    // join the named ession
    socket.join(join.session);

    // tell the new player about all existing clients in the session
    for (client_id in clients) {
      var client = clients[client_id];
      if (client.session === player.session) {
        var msg = JSON.stringify(client);
        console.log('send to ' + socket.id + ': update ' + msg);
        socket.emit('update', msg);
      }
    }

    printClients(clients);
  });

  // register a handler for client updates
  socket.on('update', function(msg) {
    // notify all clients of the update
    var client_id = socket.id;
    var client = clients[client_id];
    if (!client) {
      var error = 'no client found, update: ' + msg;
      console.log(error);
      return;
    }

    var update = JSON.parse(msg);
    client.x = update.x;
    client.y = update.y;
    client.angle = update.angle;

    update.name = client.name;
    update.session = client.session;
    update.client_id = client_id;

    var msg = JSON.stringify(update);
    //console.log('update(' + client.session + '): ' +  msg);
    io.sockets.in(client.session).emit('update', msg);
  });

  // register a handler for client disconnect
  socket.on('disconnect', function() {
    // notify all clients of the removal
    console.log('disconnect: ' + socket.id);
    var client_id = socket.id;
    var client = clients[client_id];
    if (client) {
      io.sockets.in(client.session).emit('delete', client_id);
      delete clients[client_id];
    }
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
