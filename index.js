function $(id) {
  return document.getElementById(id);
}

function log(text) {
  $('log').value += text + '\n';
}








var modeNames = [
  "INPUT",
  "OUTPUT",
  "ANALOG",
  "PWM",
  "SERVO",
];

var ports;

var selectList;
var selectBtn;

//window.onload = function() {

chrome.serial.getDevices(function (queriedPorts) {
  console.log(queriedPorts);
  ports = queriedPorts;

  selectList = document.createElement("select");

  //Create and append the options
  for (var i = 0; i < ports.length; i++) {
      var option = document.createElement("option");
      option.value = i;
      option.text = ports[i].path;
      selectList.appendChild(option);
      console.log(option);
      console.log(selectList);
  }

  document.body.appendChild(selectList);

  selectBtn = document.createElement("button");
  selectBtn.innerHTML= "connect";
  selectBtn.addEventListener('click', function() {
    console.log('clicked',selectList.selectedIndex);
    connect(selectList.selectedIndex);
    initialize();
  }, false);
  document.body.appendChild(selectBtn);


});

//}



function connect(port){
  console.log("starting to connect")
  var board = window.board = new Board(ports[port].path, function (err) {
    if (err) throw err;
    console.log("board", board);
    var form = ["form",
      { onchange: onChange, onsubmit: onSubmit },
      board.pins.map(function (pin, i) {
        console.log(i, pin);
        if (!pin.supportedModes.length) return [];
        return [".pin",
                "Pin " + i,
                renderSelect(pin, i),
                renderValue(pin, i)
        ];
      })
    ];
    document.body.appendChild(domBuilder(form));

  });
}


async function initialize() {
  await asyncsleep(5000);
  console.log("qc");
  board.queryCapabilities();
  console.log("qcd")
}

function onChange(evt) {
  var target = evt.target.name.split("-");
  var command = target[0];
  var pin = parseInt(target[1], 10);
  var value = evt.target.checked ? 1 : 0;
  var tone_command = target [1];

  console.log("onChange", command, pin, value);

  if (command === "mode") {
    var input = this["value-" + pin];
    console.log(input);
    board.pinMode(pin, value);
    if (value === board.MODES.INPUT) {

      input.disabled = true;
      board.digitalRead(pin, function (value) {
        input.checked = value;
        console.log('read',pin, value);
      });
    }else{
      input.disabled = true;
    }
  }
  else if (command === "value") {
    board.digitalWrite(pin, value);
  }

}

function onSubmit(evt) {
  evt.preventDefault();
}

function renderSelect(pin, i) {
  return ["select", {name: "mode-" + i},
    pin.supportedModes.map(function (mode) {
      var opt = {value: mode};
      if (mode === pin.mode) {
        opt.selected=true;
      }
      return ["option", opt, modeNames[mode]];
    })
  ];
}

function renderValue(pin, i) {
  var opts = {
    type: "checkbox",
    name: "value-" + i
  };
  if (pin.value) opts.checked = true;
  return ["input", opts];
}












var port = 9000;
console.log('Started');
var isServer = false;
if (http.Server && http.WebSocketServer) {
  // Listen for HTTP connections.
  var server = new http.Server();
  var wsServer = new http.WebSocketServer(server);
  server.listen(port);
  isServer = true;

  server.addEventListener('request', function(req) {
    var url = req.headers.url;
    if (url == '/')
      url = '/index.html';
    // Serve the pages of this chrome application.
    req.serveUrl(url);
    return true;
  });

  // A list of connected websockets.
  var connectedSockets = [];

  wsServer.addEventListener('request', function(req) {
    log('Client connected');
    console.log('Hiya 1');
    var socket = req.accept();
    connectedSockets.push(socket);

    // When a message is received on one socket, rebroadcast it on all
    // connected sockets.
    socket.addEventListener('message', function(e) {
      //for (var i = 0; i < connectedSockets.length; i++)
        //connectedSockets[i].send(e.data);
        //Parse the message and repackage to serial stream
        var msg = JSON.parse(e.data);
        console.log("length: ",msg.params.length);
        
        for (i = 0; i < msg.params.length; i++) {
          console.log(msg.params[i]);
        }
        
        switch (msg.method){
          case "set_pin_mode":
            console.log('Better');
            console.log(msg)
            pin = msg.params[0]
            value = msg.params[1]
            console.log(value);
            board.pinMode(pin, value);
            break;
          case "digital_pin_write":
            console.log('call Saul');
            console.log(msg)
            pin = msg.params[0]
            value = msg.params[1]
            board.digitalWrite(pin, value);
            break;
          case "play_tone":
            board.playTone(msg.params[0], msg.params[1], msg.params[2], msg.params[3]); //params: pin,tone command, frequency, duration
            break;
           
        }
        
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      log('Client disconnected');
      for (var i = 0; i < connectedSockets.length; i++) {
        if (connectedSockets[i] == socket) {
          connectedSockets.splice(i, 1);
          break;
        }
      }
    });
    return true;
  });
}

function transmit_digital_message(pin, value) {
  console.log("Slippin' Jimmy, faking sending pin " + pin + " and value " + value + " over the websocket...")
  //implement ws sending the data here
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('test');
  log('This is a test of an HTTP and WebSocket server. This application is ' +
      'serving its own source code on port ' + port + '. Each client ' +
      'connects to the server on a WebSocket and all messages received on ' +
      'one WebSocket are echoed to all connected clients - i.e. a chat ' +
      'server. Enjoy!');
// FIXME: Wait for 1s so that HTTP Server socket is listening...
setTimeout(function() {
  var address = isServer ? 'ws://localhost:' + port + '/' :
      window.location.href.replace('http', 'ws');
  var ws = new WebSocket(address);
  ws.addEventListener('open', function() {
    log('Connected');
  });
  ws.addEventListener('close', function() {
    log('Connection lost');
    $('input').disabled = true;
  });
  ws.addEventListener('message', function(e) {
    log(e.data);
  });
  $('input').addEventListener('keydown', function(e) {
    if (ws && ws.readyState == 1 && e.keyCode == 13) {
      ws.send(this.value);
      this.value = '';
    }
  });
}, 1e3);
});







