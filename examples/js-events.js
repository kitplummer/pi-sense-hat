let senseHat = require('../dist/sense-hat').create();

senseHat.on("joystick", (message) => {
    console.log("joystick event received:", JSON.stringify(message, null, 2));
});
process.on('SIGTERM', function () {
    process.exit(0);
});
