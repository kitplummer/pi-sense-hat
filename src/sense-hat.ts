import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as child_process from 'child_process';
import {getHex, getRGB, HexRGB} from './colours';
import * as path from 'path';

const spawn=child_process.spawn;

const hatCommand = path.join( __dirname, '..', 'sensehat.py');
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

export function create():SenseHat
{
    return new SenseHat();
}

export class SenseHat extends EventEmitter
{
    static instances:Array<SenseHat>=[];

    // copied from original
    private static hat = null;
    private static onclose = null;
    private static motionUsers = 0;
    private static envUsers = 0;
    private static reconnectTimer = null;

    public constructor()
    {
        super();
        this.open();
    }

    private static send(command:string)
    {
        if (this.hat) {
            this.hat.stdin.write(command+'\n');
        }
    }

    public setPixelColour(...args)
    {
        let command = SenseHat.createCmdSetPixelColour(args);
        if( command )
        {
            SenseHat.send(command);
        }
    }

    static createCmdSetPixelColour(args:any)
    {
        let expanded = [];
        let i=0;
        let j=0;
        while (i<args.length) {
            let x = args[i++];
            let y = args[i++];
            let col = args[i++];
            if (/#[a-f0-9]{3,6}|[a-z]/i.test(col)) {
                col = getRGB(col);
                if (col === null) {
                    throw new Error("Invalid colour");
                }
            } else {
                col += ","+args[i++]+","+args[i++];
            }
            if (x === '*') {
                x = "0-7";
            }
            if (y === '*') {
                y = "0-7";
            }
            let x0,x1;
            let y0,y1;
            if (typeof(x) !== 'string' || x.indexOf("-") === -1) {
                x0 = x1 = parseInt(x);
            } else {
                var px = x.split("-");
                x0 = parseInt(px[0]);
                x1 = parseInt(px[1]);
                if (x1<x0) {
                    j = x1;
                    x1 = x0;
                    x0 = j;
                }
            }
            if (typeof(y) !== 'string' || y.indexOf("-") === -1) {
                y0 = y1 = parseInt(y);
            } else {
                var py = y.split("-");
                y0 = parseInt(py[0]);
                y1 = parseInt(py[1]);
                if (y1<y0) {
                    j = y1;
                    y1 = y0;
                    y0 = j;
                }
            }
            x = x0;
            while (x<=x1) {
                y = y0;
                while (y<=y1) {
                    expanded.push([x,y,col]);
                    y++;
                }
                x++;
            }
        }
        if (expanded.length > 0) {
            var pixels = {};
            var rules = [];
            for (i=expanded.length-1; i>=0; i--) {
                var rule = expanded[i];
                if (!pixels[rule[0]+","+rule[1]]) {
                    rules.unshift(rule.join(","));
                    pixels[rule[0]+","+rule[1]] = true;
                }
            }
            if (rules.length > 0) {
                let command = "P"+rules.join(",");
                return command;
            }
        }
        
        return "";
    }

    public rotate(angle:number)
    {
        SenseHat.send(SenseHat.createCmdRotate(angle));
    }

    static createCmdRotate(angle:number):string
    {
        if( angle !== 0 && angle !== 90 && angle !==180 && angle !== 270 )
        {
            throw new Error("Angle must be 0, 90, 180 or 270")
        }
        return "R"+angle;
    }

    public flip(horizontal:boolean=false)
    {
        SenseHat.send(SenseHat.createCmdFlip(horizontal));
    }

    static createCmdFlip(horizontal:boolean=false)
    {
        return "F" + (horizontal ? "H" : "V");
    }

    public brightness(high:boolean=false)
    {
        SenseHat.send(SenseHat.createCmdBrightness(high));
    }

    static createCmdBrightness(high:boolean=false)
    {
        return "D" + (high ? "1" : "0");
    }


    public displayMessage(text:string, colour:string="white", background:string="off", speed:number=3)
    {
        SenseHat.send(SenseHat.createCmdDisplayMessage(text,colour,background,speed));
    }

    static createCmdDisplayMessage(text:string, colour:string, background:string, speed:number)
    {
        let textCol = getRGB(colour)||"255,255,255";
        let backCol = getRGB(background)||"0,0,0";
        if( isNaN(speed))
        {
            speed = null;
        }
        let retval = "T";
        // Are these if statements necessary?
        if (textCol) {
            retval += textCol;
            if (backCol) {
                retval += ","+backCol;
            }
        }

        if (speed>=1 && speed <= 5) {
            let s = 0.1 + (3-speed)*0.03;
            retval = retval + ((retval.length === 1)?"":",") + s;
        }
        retval += ":" + text;
        return retval;
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
            throw new Error( "Sense hat python file must be executable");
        }    
    }
}

