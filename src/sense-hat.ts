import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as colours from './colours';

const spawn=child_process.spawn;

const hatCommand = __dirname+'/sensehat';
// Xaccel.x,y,z,gyro.x,y,z,orientation.roll,pitch,yaw,compass
const HF_RE = /^X(.+),(.+),(.+),(.+),(.+),(.+),(.+),(.+),(.+),(.+)$/;
//  Ytemperature,humidity,pressure
const LF_RE = /^Y(.+),(.+),(.+)$/;
//  K[U|L|R|D|E][0|1|2] - joystick event:  direction,state
const KEY_RE = /^K(.)(.)$/;
const KEY_MAP = {
    "U":"UP",
    "D":"DOWN",
    "L":"LEFT",
    "R":"RIGHT",
    "E":"ENTER"
}

export default class SenseHat extends EventEmitter
{
    static instances:Array<SenseHat>=[];

    // copied from original
    private static hat = null;
    private static onclose = null;
    private static motionUsers = 0;
    private static envUsers = 0;
    private static reconnectTimer = null;

    constructor()
    {
        super();
        this.open();
    }

    // It's not the end of the world if this isn't called
    public dispose()
    {
        this.close();
    }

    private open()
    {
        if( !SenseHat.hat )
        {
            SenseHat.checkLibrary();
            SenseHat.connect();

            // For now we'll make this simple and tell the python program to raise events for everything
            SenseHat.hat.stdin.write('X1\n');
            SenseHat.hat.stdin.write('Y1\n');
        }
        SenseHat.instances.push(this);
    }

    private close()
    {
        for( let i=0; i<SenseHat.instances.length; i++ )
        {
            if( SenseHat.instances[i]===this)
            {
                SenseHat.instances.splice(i,1);
                return;
            }
        }
        
    }

    private static emit(evtName:string, value:any)
    {
        SenseHat.instances.forEach((instance:SenseHat)=>{ instance.emit(evtName,value)});
    }

    private static connect()
    {
        this.reconnectTimer = null;
        var buffer = "";
        this.hat = spawn(hatCommand);
        this.hat.stdout.on('data', function (data) {
            if( this.onclose )
            {
                return;
            }
            buffer += data.toString();
            var lines = buffer.split("\n");
            if (lines.length == 1) {
                return;
            }
            buffer = lines.pop();
            var m,msg;
            for (var i=0; i<lines.length; i++) {
                var line = lines[i];
                msg = null;
                if ((m = KEY_RE.exec(line)) !== null) {
                    SenseHat.emit("joystick", {key: KEY_MAP[m[1]], state: Number(m[2])})
                } else if ((m = LF_RE.exec(line)) !== null) {
                    SenseHat.emit( "environment",
                        {temperature: Number(m[1]), humidity: Number(m[2]), pressure: Number(m[3])});
                } else if ((m = HF_RE.exec(line)) !== null) {
                    // Xaccel.x,y,z,gyro.x,y,z,orientation.roll,pitch,yaw,compass
                    SenseHat.emit( "motion",
                        {
                            acceleration: {
                                x: Number(m[1]),
                                y: Number(m[2]),
                                z: Number(m[3])
                            },
                            gyroscope: {
                                x: Number(m[4]),
                                y: Number(m[5]),
                                z: Number(m[6])
                            },
                            orientation: {
                                roll: Number(m[7]),
                                pitch: Number(m[8]),
                                yaw: Number(m[9])
                            },
                            compass: Number(m[10])
                        });
                }
            }
        });
        this.hat.stderr.on('data', function (data) {
            // Any data on stderr means a bad thing has happened.
            // Best to kill it and let it reconnect.
            console.error("err: "+data+" :");
            this.hat.kill('SIGKILL');
        });
        this.hat.stderr.on('error', function(err) { });
        this.hat.stdin.on('error', function(err) { });

        this.hat.on('close', function (code) {
            this.hat = null;
            this.emit('close');
            console.log("sense hat closed");
            if (this.onclose) {
                this.onclose();
                this.onclose = null;
            } else if (!this.reconnectTimer) {
                this.reconnectTimer = setTimeout(function() {
                    this.connect();
                },5000);
            }
        });

        this.hat.on('error', function (err) {
            if (err.errno === "ENOENT") { console.error("ENOENT (Command not found)"); }
            else if (err.errno === "EACCES") { console.error("EACCES (Command not executable)"); }
            else {
                console.error("Error: "+': ' + err.errno);
            }
        });

        if (this.motionUsers > 0) {
            this.hat.stdin.write('X1\n');
        }
        if (this.envUsers > 0) {
            this.hat.stdin.write('Y1\n');
        }

    }

    private static disconnect(done)
    {
        if (this.hat !== null) {
            this.onclose = done;
            this.hat.kill('SIGKILL');
            this.hat = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

    }

    private static checkLibrary()
    {
        if (!fs.existsSync('/usr/lib/python2.7/dist-packages/sense_hat')) {
             throw Error("Can't find Sense HAT python libraries. Run sudo apt-get install sense-hat");
        }
    
        if ( !(1 & parseInt((fs.statSync(hatCommand).mode & parseInt ("777", 8)).toString(8)[0]) )) {
            throw new Error( "Error: node-red:rpi-gpio.errors.mustbeexecutable");
        }    
    }
}

