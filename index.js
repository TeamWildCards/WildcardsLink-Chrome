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

//window.onload = function() {

chrome.serial.getDevices(function (queriedPorts) {
  selectList = document.getElementById("WildCardsLinkSerialPortList");  //RBD: Moved WildCardsLinkSerialPortList to index.html
  //selectList.id = "WildCardsLinkSerialPortList";
  
  for (var i = 0; i < queriedPorts.length; i++) {
    var option = document.createElement("option");
    option.value = i;
    option.text = queriedPorts[i].path;
    selectList.appendChild(option);
  }
  
  selectBtn = document.getElementById("connectButton"); //RBD: Button is created on Index.html now
  launchBtn = document.getElementById("launchButton"); //RBD: Launch button for scratch
  boardImage = document.getElementById("boardImage"); //RBD to be used to modify board image later
  arrowImage = document.getElementById("arrowImage"); //RBD to be used to modify arrow image later
  scratchImage = document.getElementById("scratchImage"); //RBD to be used to modify scratch image later
  boardImage.className = "inactiveImg"; //RBD Grey out the image using CSS class
  arrowImage.className = "inactiveImg";
  scratchImage.className = "inactiveImg";
  
  
  //RBD: Button cannot be clicked until a USB device is connected. Im handing the enabling of the button click in the promise
  
  selectBtn.addEventListener('click', function() {
    console.log('clicked',selectList.selectedIndex);
    //RBD: Using the button text to determine what action to take on the button
    //     If "connect", then er uh....connect. Will need to add disconnect?
    if (selectBtn.innerHTML == "Connect"){
      connect(selectList.options[selectList.selectedIndex].text);
      initialize();
      selectBtn = document.getElementById("connectButton").innerHTML = "Connecting...";
    }else{
      console.log('Whoa Black Betty, Bamalam');
    }
    
  }, false);
  
  launchBtn.addEventListener('click', function() {
    console.log('Scratch Launched');
    window.open("https://scratch.wildcards.io");
  }, false);
});

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
  //RBD: Firmata.js changes button text to connected, in case you were wondering :)

}


async function initialize() {
  await asyncsleep(3000);
  board.reportVersion();
  await asyncsleep(100);
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
        console.log('socket received event: message')
        var msg = JSON.parse(e.data);
        console.log("length: ",msg.params.length);
        
        for (i = 0; i < msg.params.length; i++) {
          console.log(msg.params[i]);
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
            console.log(msg)
            board.analogWrite(parseInt(msg.params[0]), parseInt(msg.params[1])); //params: pin,value
            break;
            
           
        }
        
    });

    // When a socket is closed, remove it from the list of connected sockets.
    socket.addEventListener('close', function() {
      console.log('Client disconnected'); //RBD: Used console.log
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
  console.log("Slippin' Jimmy, faking sending pin " + pin + " and value " + value + " over the websocket...");
  var msg = JSON.stringify({"method": "analog_message_reply", "params": [pin, value.toString()]});
  window.ws.send(msg);
}


document.addEventListener('DOMContentLoaded', function() {
  debugger;
  console.log("ok"); //RBD: Used console.log
  console.log('Setting up WebSocket on port ' + port); //RBD: Used console.log
// FIXME: Wait for 1s so that HTTP Server socket is listening...
setTimeout(function() {
  var address = isServer ? 'ws://localhost:' + port + '/' :
      window.location.href.replace('http', 'ws');
  window.ws = new WebSocket(address);
  window.ws.addEventListener('open', function() {
    console.log('Connected'); //RBD: Used console.log
  });
  window.ws.addEventListener('close', function() {
    console.log('Connection lost'); //RBD: Used console.log
    $('input').disabled = true;
  });
  window.ws.addEventListener('message', function(e) {
    log(e.data);
  });
  $('input').addEventListener('keydown', function(e) {
    if (window.ws && window.ws.readyState == 1 && e.keyCode == 13) {
      window.ws.send(this.value);
      this.value = '';
    }
  });
}, 1e3);
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
      if (selectList.options.length == 0){
        selectBtn.setAttribute("disabled", true);
        selectBtn.className = "btn btn-secondary btn-lg";
        selectBtn.innerHTML = "Plug in Your Board"
        boardImage.className = "inactiveImg";
        arrowImage.className = "inactiveImg";
        scratchImage.className = "inactiveImg";
        
      } else if (selectList.options.length > 0) {
        selectBtn.removeAttribute("disabled");
        selectBtn.className = "btn btn-primary btn-lg";
        selectBtn.innerHTML = "Connect"
        boardImage.className = "activeImg";
        
        
      }
    //start by setting all ports to not display
    /*
    for(var key in serialList) {
      serialList[key].ready = false;
    }
    
    chrome.serial.getDevices(function (queriedPorts) {
      console.log(queriedPorts);
      console.log(selectList);
      ports = queriedPorts;
      
      for (var i = 0; i < ports.length; i++) {
        //if the port is found, mark that it is ready
        if (serialList[ports[i].path]) {
          serialList[ports[i].path].ready = true;
        }
        //or create it if needed
        else {
          serialList[ports[i].path] = new serialPort(true, i, ports[i].path)
          serialList[ports[i].path].ready = true;
          serialList[ports[i].path].index = Object.keys(serialList).length-1;
          serialList[ports[i].path].path = ports[i].path;
        }
      }
      
      //need to try disable, etc. or just give up on index???
      for(var key in serialList) {
        if (serialList[key].index >= selectList.options.length) {
          var option = document.createElement("option");
          option.value = serialList[key].index;
          option.text = serialList[key].path;
          selectList.appendChild(option);
        }
        else if (serialList[key].ready) {
          var option = document.createElement("option");
          option.value = serialList[key].index;
          option.text = serialList[key].path;
          selectList.options[serialList[key].index] = option;
        }
        else {
          selectList.options[serialList[key].index] = null;
        }
  
  
          //console.log(option);
          //console.log(selectList);
      }
      */
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





