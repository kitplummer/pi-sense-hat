import SenseHat from '../src/sense-hat'

let senseHat = new SenseHat();

senseHat.on("joystick", (message)=>{
    console.log("joystick event received:", message);
})

senseHat.on("environment", (message)=>{
    console.log("environment event received:", message);
})

senseHat.on("motion", (message)=>{
    console.log("motion event received:", message);
})



process.on('SIGTERM', function () {
      process.exit(0);
  });