
// Run test with:
//  npm run test
//  npm run test -- test-benchmark.js
//  npm run test -- -w test-benchmark.js

import test from "ava";
import microtime from "microtime";
import seedrandom from "seedrandom";
import abecs from "./src/abecs.js";


function logtime(tag, mt1, mt2, entityCount, iteration) {
    let elapse = mt2 - mt1;
    let rate = Math.floor( iteration / (elapse || 1) * 1000000 );
    let msg = (tag + " - ").padEnd(26, " ") +
        "entities: " + (entityCount.toLocaleString() + "; ").padEnd(10, " ") +
        "pass: " + (iteration.toLocaleString() + "; ").padEnd(13, " ") +
        "time: " + elapse.toLocaleString() + "us; " +
        "rate: " + rate.toLocaleString() + " op/sec";
    console.log(msg);
}

test("benchmark", t => {

    let mt1, mt2, iteration, entityCount = 100000;

    let s = abecs.newScene();
    let alive = s.registerComponent("alive", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(entityCount);
    t.is(s.hasBuilt, true);


    // iteration = 100000000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.isInUse(0);
    // logtime("isInUse 0", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.isInUse(1);
    // logtime("isInUse 1", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.isInUse(99999);
    // logtime("isInUse 99999", mt1, microtime.now(), entityCount, iteration);

    // for (let k = 0; k < entityCount; k++)
    //     s.allocateEntity();
    
    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.isInUse(99999);
    // logtime("isInUse+allocate 99999", mt1, microtime.now(), entityCount, iteration);


    // iteration = 100000000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.isOn(0, alive);
    // logtime("isOn 0", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.isOn(1, pos);
    // logtime("isOn 1", mt1, microtime.now(), entityCount, iteration);


    // iteration = 1000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     for (let k = 0; k < entityCount; k++)
    //         s.componentOn(k, alive);
    // logtime("compOn " + entityCount + " alive", mt1, microtime.now(), entityCount, iteration * entityCount);
    
    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     for (let k = 0; k < entityCount; k++)
    //         s.componentOn(k, pos);
    // logtime("compOn " + entityCount + " pos:3", mt1, microtime.now(), entityCount, iteration * entityCount);


    // iteration = 200000000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setValue(0, alive, 10);
    // logtime("setValue 0 alive", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setValue(1, pos, 100);
    // logtime("setValue 1 pos", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setValue(99999, pos, 999990);
    // logtime("setValue 99999 pos:3", mt1, microtime.now(), entityCount, iteration);


    // iteration = 200000000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getValue(0, alive);
    // logtime("getValue 0 alive", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getValue(1, pos);
    // logtime("getValue 1 pos:3", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getValue(99999, pos);
    // logtime("getValue 99999 pos:3", mt1, microtime.now(), entityCount, iteration);


    // iteration = 200000000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(0, alive, 0, 10);
    // logtime("setSlot 0 alive[0]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(1, pos, 0, 100);
    // logtime("setSlot 1 pos[0]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(1, pos, 1, 101);
    // logtime("setSlot 1 pos[1]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(1, pos, 2, 102);
    // logtime("setSlot 1 pos[2]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(99999, pos, 0, 999990);
    // logtime("setSlot 99999 pos[0]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(99999, pos, 1, 999991);
    // logtime("setSlot 99999 pos[1]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.setSlot(99999, pos, 2, 999992);
    // logtime("setSlot 99999 pos[2]", mt1, microtime.now(), entityCount, iteration);

    
    // iteration = 200000000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(0, alive, 0);
    // logtime("getSlot 0 alive[0]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(1, pos, 0);
    // logtime("getSlot 1 pos[0]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(1, pos, 1);
    // logtime("getSlot 1 pos[1]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(1, pos, 2);
    // logtime("getSlot 1 pos[2]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(99999, pos, 0);
    // logtime("getSlot 99999 pos[0]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(99999, pos, 1);
    // logtime("getSlot 99999 pos[1]", mt1, microtime.now(), entityCount, iteration);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.getSlot(99999, pos, 2);
    // logtime("getSlot 99999 pos[2]", mt1, microtime.now(), entityCount, iteration);

    
    iteration = 1000;

    for (let k = 0; k < entityCount; k++)
        s.componentOn(k, alive);
    mt1 = microtime.now();
    for (let i = 0; i < iteration; i++)
        s.iterate(alive, () => {});
    logtime("iterate alive all-on", mt1, microtime.now(), entityCount, iteration);


    iteration = 100000;
    
    for (let k = 0; k < entityCount; k++)
        s.componentOff(k, alive);
    mt1 = microtime.now();
    for (let i = 0; i < iteration; i++)
        s.iterate(alive, () => {});
    logtime("iterate alive all-off", mt1, microtime.now(), entityCount, iteration);


    iteration = 500000000;

    for (let k = 0; k < entityCount; k++)
        s.componentOn(k, alive);
    mt1 = microtime.now();
    for (let i = 0; i < iteration; i++)
        s.getEntities(alive);
    logtime("getEntities alive on", mt1, microtime.now(), entityCount, iteration);
    t.is(s.getEntities(alive).length, entityCount);


    iteration = 100000000;

    for (let k = 0; k < entityCount; k++)
        s.componentOff(k, alive);
    mt1 = microtime.now();
    for (let i = 0; i < iteration; i++)
        s.getEntities(alive);
    logtime("getEntities alive on2", mt1, microtime.now(), entityCount, iteration);
    t.is(s.getEntities(alive).length, 0);


    // iteration = 1000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++)
    //     s.build(entityCount);
    // logtime("build " + entityCount, mt1, microtime.now(), entityCount, iteration);


    // iteration = 1000;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++) {
    //     for (let k = 0; k < entityCount; k++)
    //         s.allocateEntity();
    // }
    // logtime("allocateEntity " + entityCount, mt1, microtime.now(), entityCount, iteration * entityCount);

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++) {
    //     for (let k = 0; k < entityCount; k++)
    //         s.allocateEntity();
    //     s.build(entityCount);
    // }
    // logtime("allocate+build " + entityCount, mt1, microtime.now(), entityCount, iteration * entityCount);


    // iteration = 200;

    // mt1 = microtime.now();
    // for (let i = 0; i < iteration; i++) {
    //     for (let k = 0; k < entityCount; k++)
    //         s.freeEntity(k);
    // }
    // logtime("freeEntity " + entityCount, mt1, microtime.now(), entityCount, iteration * entityCount);
    
    
});


test("dummy", t => {
    t.pass();
});

