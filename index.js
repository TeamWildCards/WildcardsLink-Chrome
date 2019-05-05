function $(id) {
  return document.getElementById(id);
}

//function asyncsleep(ms) {
//  return new Promise(resolve => setTimeout(resolve, ms));
//}

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

var ws = null;

var ports;

var serialList = {};

var selectBtn;

window.onload = function() {
  selectBtn = document.getElementById("connectButton"); //RBD: Button is created on Index.html now
  boardImage = document.getElementById("boardImage"); //RBD to be used to modify board image later


  chrome.serial.getDevices(function (queriedPorts) {
    selectList = document.getElementById("WildCardsLinkSerialPortList");  //RBD: Moved WildCardsLinkSerialPortList to index.html
    //selectList.id = "WildCardsLinkSerialPortList";
    
    for (var i = 0; i < queriedPorts.length; i++) {
      var option = document.createElement("option");
      option.value = i;
      option.text = queriedPorts[i].path;
      selectList.appendChild(option);
    }
    
    
    boardImage.className = "inactiveImg"; //RBD Grey out the image using CSS class
    selectBtn.disabled = true; //RBD: Button disables until a USB device is connected. Enabling of the button click is in the promise
    
    selectBtn.addEventListener('click', function() {
      console.log('clicked',selectList.selectedIndex);
      //RBD: Using the button text to determine what action to take on the button
      //     If "connect", then er uh....connect. Will need to add disconnect?
      if (selectBtn.innerHTML == "Connect"){
        connect(selectList.options[selectList.selectedIndex].text);
        initialize();
        selectBtn = document.getElementById("connectButton").innerHTML = "Connecting...";
      }else if(selectBtn.innerHTML == "Launch Scratch" || selectBtn.innerHTML == "Re-Launch Scratch"){
        console.log('Scratch Launched');
        window.open("https://scratch.wildcards.io");
      }
      
    }, false);
  });
}
//}



function connect(port){
  console.log("starting to connect to " + port);
  var board = window.board = new Board(port, function (err) {
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
  //RBD: Firmata.js changes button text to 'Launch Scratch', in case you were wondering :)

}


async function initialize() {
  await asyncsleep(3000);
  board.reportVersion();
  await asyncsleep(100);
  console.log("qc");
  board.queryCapabilities();
  console.log("qcd")
  board.queryAnalogMapping();
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
    console.log('Client connected');  //RBD: Used console.log
    console.log('wsServer received event: request');
    var socket = req.accept();
    connectedSockets.push(socket);

    // When a message is received on one socket, rebroadcast it on all
    // connected sockets.
    socket.addEventListener('message', function(e) {
      //for (var i = 0; i < connectedSockets.length; i++)
        //connectedSockets[i].send(e.data);
        //Parse the message and repackage to serial stream
        //console.log('socket received event: message')
        var msg = JSON.parse(e.data);
        //console.log("length: ",msg.params.length);
        //RBD: Using this listener to indicate that the extension has been loaded.
        if(selectBtn.innerHTML == "Launch Scratch" || selectBtn.innerHTML == "Re-Launch Scratch"){
          selectBtn.innerHTML = "Extension Loaded";
          selectBtn.className = "btn btn-success btn-lg";
        }
        
        for (i = 0; i < msg.params.length; i++) {
          //console.log(msg.params[i]);
        }
        
        switch (msg.method){
          case "set_pin_mode":
            console.log(msg)
            pin = parseInt(msg.params[0])
            value = parseInt(msg.params[1])
            console.log(value);
            board.pinMode(pin, value);
            if (value = "0"){
              board.enableDigitalReporting(pin);
            }
            break;
          case "digital_pin_write":
            console.log(msg)
            pin = parseInt(msg.params[0])
            value = parseInt(msg.params[1])
            board.digitalWrite(pin, value);
            break;
          case "play_tone":
            console.log(msg)
            board.playTone(parseInt(msg.params[0]), msg.params[1], parseInt(msg.params[2]), parseInt(msg.params[3])); //params: pin,tone command, frequency, duration
            break;
          case "servo_config":
            console.log(msg)
            board.servoConfig(parseInt(msg.params[0]), parseInt(msg.params[1]), parseInt(msg.params[2])); //params: pin,min_pulse, max_pulse
            break;
          case "analog_write":
            //console.log(msg)
            board.analogWrite(parseInt(msg.params[0]), parseInt(msg.params[1])); //params: pin,value
            break;
            
           
        }
        
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      console.log('Client disconnected');
      //RBD: Indicate that scratch has been closed
      if(selectBtn.innerHTML == "Extension Loaded") {
          selectBtn.className = "btn btn-danger btn-lg";
          selectBtn.innerHTML = "Re-Launch Scratch";
        }
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
    console.log("Slippin' Jimmy, faking sending analog pin " + pin + " and value " + value + " over the websocket...")
  var msg = JSON.stringify({"method": "digital_message_reply", "params": [pin, value.toString()]});
  console.log("message generated");
  for (var i = 0; i < connectedSockets.length; i++)
    connectedSockets[i].send(msg);

  //window.ws.send(msg);
  console.log("digital message sent...  ", msg);
}

function transmit_analog_message(pin, value) {
  //console.log("Slippin' Jimmy, faking sending pin " + pin + " and value " + value + " over the websocket...");
  var msg = JSON.stringify({"method": "analog_message_reply", "params": [pin, value.toString()]});
  //console.log("analog message generated");
  for (var i = 0; i < connectedSockets.length; i++)
    connectedSockets[i].send(msg);
  //window.ws.send(msg);
  //console.log("analog message sent...  ", msg);
}


document.addEventListener('DOMContentLoaded', function() {
  //debugger;
  console.log("DOMContentLoaded");
});



var promiseKeepUpdatingSerialDeviceList = new Promise(async function(resolve, reject) {
  selectList = document.getElementById("WildCardsLinkSerialPortList");
  await asyncsleep(1000);

  //loop time...
  while(1){
    chrome.serial.getDevices(function (queriedPorts) {
      //debugger;
      while(selectList.options.length)
        selectList.options.remove(0)
      console.log(selectList);
      for (var i = 0; i < queriedPorts.length; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = queriedPorts[i].path;
        selectList.appendChild(option);
      }
      
      //RBD: Activate and modify the button if selectList grows/shrinks i.e. a device is connected or device is removed
      //     Buttons are disabled/greyed out if the length of the list is 0 hence no devices connected.
      //FIXME: This does not update after the board has been connected.....hrrmmmmmmmm
      
      selectBtn = document.getElementById("connectButton");

      if (selectList.options.length < 1){
        if(selectBtn.innerHTML == "Connect" || selectBtn.innerHTML == "Launch Scratch" || selectBtn.innerHTML == "Extension Loaded" || selectBtn.innerHTML == "Re-Launch Scratch")  {
          selectBtn.disabled = true;
          selectBtn.className = "btn btn-danger btn-lg";
          selectBtn.innerHTML = "Re-Plug in Your Board";
          boardImage.className = "inactiveImg";
        }
        
      } else if (selectList.options.length > 0) {
        if(selectBtn.innerHTML == "Plug in Your Board" || selectBtn.innerHTML == "Re-Plug in Your Board") {
          selectBtn.disabled = false;
          selectBtn.className = "btn btn-primary btn-lg";
          selectBtn.innerHTML = "Connect"
          boardImage.className = "activeImg";
        }
      }
    });
    await asyncsleep(2000);
    //console.log("done waiting again")
  }
});

var promiseKeepSendingSerialData = new Promise(async function(resolve, reject) {
  setTimeout(resolve, 100, 'foo');
});

Promise.all([promiseKeepUpdatingSerialDeviceList, promiseKeepSendingSerialData]).then(function(values) {
  console.log(values);
});





