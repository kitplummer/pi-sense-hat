import * as chai from 'chai';
const expect = chai.expect;

import { SenseHat } from '../src/sense-hat';

describe("SenseHat", ()=>{
    describe("constructor", ()=>{
        it("should create a new SenseHat object", ()=>{
            // This will now throw an error if not run on pi with sense-hat library installed
            // new SenseHat();
        })
    });
    describe("createCmdDisplayMessage", ()=>{
        it("should return a comma separated string command prefixed by T, with appropriate values", ()=>{
            expect(SenseHat.createCmdDisplayMessage("Hello World!", "white", "off", 4 )).to.equal("T255,255,255,0,0,0,0.07:Hello World!");
        });
    });
    describe("createCmdSetPixelColour", ()=>{
        it("should return a comma separated string command prefixed by P, with appropriate values", ()=>{
            expect(SenseHat.createCmdSetPixelColour([0,0,"red",0,7,"#00ff00",7,7,"yellow",7,0,0,0,255])).to.equal("P0,0,255,0,0,0,7,0,255,0,7,7,255,255,0,7,0,0,0,255");
        });
    });
    describe("createCmdRotate", ()=>{
        it("should return the angle prefixed by R if valid angle", ()=>{
            expect(SenseHat.createCmdRotate(0)).to.equal("R0");
            expect(SenseHat.createCmdRotate(90)).to.equal("R90");
            expect(SenseHat.createCmdRotate(180)).to.equal("R180");
            expect(SenseHat.createCmdRotate(270)).to.equal("R270");
        });
        it("should throw an error if angle not valid", ()=>{
            expect(()=>{SenseHat.createCmdRotate(74)}).to.throw();
        });
    });

    describe("createCmdFlip", ()=>{
        it("should return 'FV' if horizontal is false or not set", ()=>{
            expect(SenseHat.createCmdFlip()).to.equal("FV");
            expect(SenseHat.createCmdFlip(false)).to.equal("FV");
        });
        it("should return 'FV' if horizontal is true", ()=>{
            expect(SenseHat.createCmdFlip(true)).to.equal("FH");
        });
    });

    describe("createCmdBrightness", ()=>{
        it("should return 'D0' if horizontal is false or not set", ()=>{
            expect(SenseHat.createCmdBrightness()).to.equal("D0");
            expect(SenseHat.createCmdBrightness(false)).to.equal("D0");
        });
        it("should return 'D1' if horizontal is true", ()=>{
            expect(SenseHat.createCmdBrightness(true)).to.equal("D1");
        });
    });
});