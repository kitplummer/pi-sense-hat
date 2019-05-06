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
});