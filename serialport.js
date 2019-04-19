function SerialPort(port, recvcallback, options) {


  var self = this;
  var id;
  var bytesToRead = options.buffersize || 1;
  var reading = false;

  function onOpen (info) {
    console.log('onOpen', info);
    if(info){
      id = self.id = info.connectionId;
      if (id < 0) {
    		console.log('error, can\'t connect to ', port);
        return;
      }
      console.log("open");
      chrome.serial.onReceive.addListener(function(obj){
        if(id == obj.connectionId){
          var data = new Uint8Array(obj.data);
    		  recvcallback(data);   //recvcallback function receives the data from the serial port
          //self.emit("data", data);
        }
      });
      console.log("opened")
    }
    else{
      console.log('can\'t connect to ', port);
    }
  }

  chrome.serial.connect(port, {
    bitrate: options.baudrate || 57600
  }, onOpen);
  console.log("connect done")
}

SerialPort.prototype.write = function (data) {
  function onWrite() {
    //console.log("onWrite", arguments);
  }
  console.log("writing", data)
  data = new Uint8Array(data);
  console.log("OUT", data);
  if(this.id){
    chrome.serial.send(this.id, data.buffer, onWrite);
	console.log(data.buffer)
  }

};
