console.log("Starting");
let senseHat = require('../dist/sense-hat').create();

console.log("Displaying message");
senseHat.displayMessage("Hello World!", "red", "blue");
console.log("Done");
return;