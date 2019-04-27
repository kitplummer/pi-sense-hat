import * as chai from 'chai';
const expect = chai.expect;

import SenseHat from '../src/sense-hat';

describe("SenseHat", ()=>{
    describe("constructor", ()=>{
        it("should create a new SenseHat object", ()=>{
            new SenseHat();
        })
    });
});