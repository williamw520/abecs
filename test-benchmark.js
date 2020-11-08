
// Run test with:
//  npm run test
//  npm run test -- test-benchmark.js
//  npm run test -- -w test-benchmark.js

import test from "ava";
import microtime from "microtime";
import seedrandom from "seedrandom";
import abecs from "./src/abecs.js";

const FRAME60 = 60;         // for 60 FPS

function logheader() {
    let msg = 
        "| Functional Area ".padEnd(44, " ") +
        "| Entities ".padEnd(12, " ") +
        "| Runs ".padEnd(14, " ") +
        "| Operations ".padEnd(14, " ") +
        "| Time ms ".padEnd(10, " ") +
        "| nanosec/op ".padEnd(13, " ") +
        "| ops/sec ".padEnd(17, " ") +
        "| Runs/frame ".padEnd(15, " ") +
        "| FPS of Runs ".padEnd(16, " ") +
        "|";
    console.log(msg);
    msg = 
        "|:".padEnd(44, "-") +
        "|:".padEnd(12, "-") +
        "|:".padEnd(14, "-") +
        "|:".padEnd(14, "-") +
        "|:".padEnd(10, "-") +
        "|:".padEnd(13, "-") +
        "|:".padEnd(17, "-") +
        "|:".padEnd(15, "-") +
        "|:".padEnd(16, "-") +
        "|";
    console.log(msg);
}

function logtime(tag, mt1, mt2, entityCount, runs, opsPerRun) {
    const microseconds = (mt2 - mt1) || 1;
    const ms = microseconds / 1000;
    const ops = runs * (opsPerRun || 1);
    const ops_rate  = Math.floor( ops / microseconds * 1000000 );
    const runs_per_second = (runs * 1000000) / microseconds;
    const runs_per_frame  = Math.floor( (runs_per_second / FRAME60) * 10 ) / 10;
    const runs_fps = Math.floor( runs_per_frame * FRAME60 );
    const unit_time = (microseconds * 1000) / ops;
    const item_rate = Math.floor( (entityCount * ops) / (microseconds || 1) * 1000000 );
    const msg = 
        "| " + (tag + " ").padEnd(42, " ") +
        "| " + (entityCount.toLocaleString()).padEnd(10, " ") +
        "| " + (runs.toLocaleString()).padEnd(12, " ") +
        "| " + (ops.toLocaleString()).padEnd(12, " ") +
        "| " + (Math.round(ms).toLocaleString()).padEnd(8, " ") +
        "| " + (unit_time.toLocaleString()).padEnd(11, " ") +
        "| " + (ops_rate.toLocaleString()).padEnd(15, " ") +
        "| " + (runs_per_frame.toLocaleString()).padEnd(13, " ") +
        "| " + (runs_fps.toLocaleString()).padEnd(14, " ") +
        "|";
    console.log(msg);
}

test("benchmark", t => {

    logheader();

    let mt1, mt2, runs, entityCount = 100000;

    let s = abecs.newScene();
    let health = s.registerComponent("health", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(entityCount);
    t.is(s.hasBuilt, true);


    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.isInUse(0);
    logtime("entity isInUse at 0", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.isInUse(1);
    logtime("entity isInUse at 1", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.isInUse(99999);
    logtime("entity isInUse at 99999", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    for (let k = 0; k < entityCount; k++)
        s.allocateEntity();
    t.is(s.isInUse(entityCount-1), true);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.isInUse(99999);
    logtime("entities allocated, isInUse", mt1, microtime.now(), entityCount, runs, 1);


    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.isOn(0, health);
    logtime("component health isOn 0", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.isOn(1, pos);
    logtime("component pos isOn 1", mt1, microtime.now(), entityCount, runs, 1);


    runs = 1000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        for (let k = 0; k < entityCount; k++)
            s.componentOn(k, health);
    logtime("compOn " + entityCount + " health", mt1, microtime.now(), entityCount, runs, entityCount);
    
    runs = 1000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        for (let k = 0; k < entityCount; k++)
            s.componentOn(k, pos);
    logtime("compOn " + entityCount + " pos[3]", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 10000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.componentOnCount(pos);
    logtime("componentOnCount ", mt1, microtime.now(), entityCount, runs, 1);

    
    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setValue(0, health, 10);
    logtime("setValue 0 health", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setValue(1, pos, 100);
    logtime("setValue 1 pos", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setValue(99999, pos, 999990);
    logtime("setValue 99999 pos[3]", mt1, microtime.now(), entityCount, runs, 1);


    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getValue(0, health);
    logtime("getValue 0 health", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getValue(1, pos);
    logtime("getValue 1 pos[3]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getValue(99999, pos);
    logtime("getValue 99999 pos[3]", mt1, microtime.now(), entityCount, runs, 1);


    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(0, health, 0, 10);
    logtime("setSlot 0 health[0]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(1, pos, 0, 100);
    logtime("setSlot 1 pos[0]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(1, pos, 1, 101);
    logtime("setSlot 1 pos[1]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(1, pos, 2, 102);
    logtime("setSlot 1 pos[2]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(99999, pos, 0, 999990);
    logtime("setSlot 99999 pos[0]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(99999, pos, 1, 999991);
    logtime("setSlot 99999 pos[1]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.setSlot(99999, pos, 2, 999992);
    logtime("setSlot 99999 pos[2]", mt1, microtime.now(), entityCount, runs, 1);

    
    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(0, health, 0);
    logtime("getSlot 0 health[0]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(1, pos, 0);
    logtime("getSlot 1 pos[0]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(1, pos, 1);
    logtime("getSlot 1 pos[1]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(1, pos, 2);
    logtime("getSlot 1 pos[2]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(99999, pos, 0);
    logtime("getSlot 99999 pos[0]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(99999, pos, 1);
    logtime("getSlot 99999 pos[1]", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlot(99999, pos, 2);
    logtime("getSlot 99999 pos[2]", mt1, microtime.now(), entityCount, runs, 1);

    
    runs = 1000;
    for (let k = 0; k < entityCount; k++)
        s.componentOn(k, health);
    let compOnCount = s.componentOnCount(health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.iterate(health, () => {});
    logtime("iterate all components on", mt1, microtime.now(), entityCount, runs, compOnCount);


    runs = 100000;
    for (let k = 0; k < entityCount; k++)
        s.componentOff(k, health);
    compOnCount = s.componentOnCount(health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.iterate(health, () => {});
    logtime("iterate all components off", mt1, microtime.now(), entityCount, runs, compOnCount);


    runs = 100000000;
    for (let k = 0; k < entityCount; k++)
        s.componentOn(k, health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getEntities(health);
    logtime("getEntities of on-component", mt1, microtime.now(), entityCount, runs, 1);
    t.is(s.getEntities(health).length, entityCount);


    runs = 100000000;
    for (let k = 0; k < entityCount; k++)
        s.componentOff(k, health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getEntities(health);
    logtime("getEntities of off-component", mt1, microtime.now(), entityCount, runs, 1);
    t.is(s.getEntities(health).length, 0);


    runs = 2000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.build(entityCount);
    logtime("build scene ", mt1, microtime.now(), entityCount, runs, 1);


    runs = 1000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        for (let k = 0; k < entityCount; k++)
            s.allocateEntity();
    }
    logtime("allocateEntity ", mt1, microtime.now(), entityCount, runs, entityCount);

    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        for (let k = 0; k < entityCount; k++)
            s.allocateEntity();
        s.build(entityCount);
    }
    logtime("allocateEntity and build ", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 200;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        for (let k = 0; k < entityCount; k++)
            s.freeEntity(k);
    }
    logtime("freeEntity ", mt1, microtime.now(), entityCount, runs, entityCount);
    
    
});


test("system-fn-10K", t => {
    let mt1, mt2, runs, entityCount = 10000;

    let s = abecs.newScene();
    let health = s.registerComponent("health", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(entityCount);
    t.is(s.hasBuilt, true);

    for (let k = 0; k < entityCount; k++) {
        let eid = s.allocateEntity();
        s.componentOn(eid, health);
        s.componentOn(eid, pos);
        s.componentOn(eid, dir);
    }
    t.is(s.getEntities(health).length, entityCount);

    let sysSetValue = (s, eid, cid, ctx) => {
        s.setValue(eid, cid, 10);
    };

    let sysSetSpeed = (s, eid, cid, ctx) => {
        s.setSlot(eid, pos, 0, 100);
        s.setSlot(eid, pos, 1, 110);
        s.setSlot(eid, pos, 2, 120);
        s.setSlot(eid, dir, 0, 10);
        s.setSlot(eid, dir, 1, 11);
        s.setSlot(eid, dir, 2, 12);
    };

    let sysCalcSpeed = (s, eid, cid, ctx) => {
        let x  = s.getSlot(eid, pos, 0);
        let y  = s.getSlot(eid, pos, 1);
        let z  = s.getSlot(eid, pos, 2);
        let vx = s.getSlot(eid, dir, 0);
        let vy = s.getSlot(eid, dir, 1);
        let vz = s.getSlot(eid, dir, 2);
        s.setSlot(eid, pos, 0, x + vx);
        s.setSlot(eid, pos, 1, y + vx);
        s.setSlot(eid, pos, 2, z + vx);
    };
    

    runs = 60000;
    s.registerSystem(health, sysSetValue);
    // s.registerSystem(health, (s, eid, cid, ctx) => {
    //     s.setValue(eid, cid, 10);
    // });
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.applySystems();
    logtime("10K entities, applySystems", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 60000;
    let sysfn = s.systemHandler(health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysfn(s, k, health);
        }
    }
    logtime("10K, getEntities+loop NOP", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 60000;
    s.registerSystem(health, sysSetValue);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.applySystems();
    logtime("10K, applySystems with setValue", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 60000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            s.setValue(k, health, 10);
        }
    }
    logtime("10K, getEntities+loop with setValue", mt1, microtime.now(), entityCount, runs, entityCount);

    
    runs = 6000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        entities.forEach( eid => s.setValue(eid, health, 10) );
    }
    logtime("10K, getEntities+forEach with setValue", mt1, microtime.now(), entityCount, runs, entityCount);
    

    runs = 600;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysSetSpeed(s, k);
        }
    }
    logtime("10K, getEntities+loop with sysSetSpeed", mt1, microtime.now(), entityCount, runs, entityCount);

    
    runs = 600;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysCalcSpeed(s, k);
        }
    }
    logtime("10K, getEntities+loop with sysCalcSpeed", mt1, microtime.now(), entityCount, runs, entityCount);


    t.pass();
});


test("system-fn-100K", t => {
    let mt1, mt2, runs, entityCount = 100000;

    let s = abecs.newScene();
    let health = s.registerComponent("health", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(entityCount);
    t.is(s.hasBuilt, true);

    for (let k = 0; k < entityCount; k++) {
        let eid = s.allocateEntity();
        s.componentOn(eid, health);
        s.componentOn(eid, pos);
        s.componentOn(eid, dir);
    }
    t.is(s.getEntities(health).length, entityCount);

    let sysSetValue = (s, eid, cid, ctx) => {
        s.setValue(eid, cid, 10);
    };

    let sysSetSpeed = (s, eid, cid, ctx) => {
        s.setSlot(eid, pos, 0, 100);
        s.setSlot(eid, pos, 1, 110);
        s.setSlot(eid, pos, 2, 120);
        s.setSlot(eid, dir, 0, 10);
        s.setSlot(eid, dir, 1, 11);
        s.setSlot(eid, dir, 2, 12);
    };

    let sysCalcSpeed = (s, eid, cid, ctx) => {
        let x  = s.getSlot(eid, pos, 0);
        let y  = s.getSlot(eid, pos, 1);
        let z  = s.getSlot(eid, pos, 2);
        let vx = s.getSlot(eid, dir, 0);
        let vy = s.getSlot(eid, dir, 1);
        let vz = s.getSlot(eid, dir, 2);
        s.setSlot(eid, pos, 0, x + vx);
        s.setSlot(eid, pos, 1, y + vx);
        s.setSlot(eid, pos, 2, z + vx);
    };
    

    runs = 1000;
    s.registerSystem(health, sysSetValue);
    // s.registerSystem(health, (s, eid, cid, ctx) => {
    //     s.setValue(eid, cid, 10);
    // });
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.applySystems();
    logtime("100K entities, applySystems", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 6000;
    let sysfn = s.systemHandler(health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysfn(s, k, health);
        }
    }
    logtime("100K, getEntities+loop NOP", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 1000;
    s.registerSystem(health, sysSetValue);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.applySystems();
    logtime("100K, applySystems with setValue", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 6000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            s.setValue(k, health, 10);
        }
    }
    logtime("100K, getEntities+loop with setValue", mt1, microtime.now(), entityCount, runs, entityCount);

    
    runs = 600;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        entities.forEach( eid => s.setValue(eid, health, 10) );
    }
    logtime("100K, getEntities+forEach with setValue", mt1, microtime.now(), entityCount, runs, entityCount);
    

    runs = 60;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysSetSpeed(s, k);
        }
    }
    logtime("100K, getEntities+loop with sysSetSpeed", mt1, microtime.now(), entityCount, runs, entityCount);

    
    runs = 60;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysCalcSpeed(s, k);
        }
    }
    logtime("100K, getEntities+loop with sysCalcSpeed", mt1, microtime.now(), entityCount, runs, entityCount);


    t.pass();
});


test("system-fn-1M", t => {
    let mt1, mt2, runs, entityCount = 1000000;

    let s = abecs.newScene();
    let health = s.registerComponent("health", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(entityCount);
    t.is(s.hasBuilt, true);

    for (let k = 0; k < entityCount; k++) {
        let eid = s.allocateEntity();
        s.componentOn(eid, health);
        s.componentOn(eid, pos);
        s.componentOn(eid, dir);
    }
    t.is(s.getEntities(health).length, entityCount);

    let sysSetValue = (s, eid, cid, ctx) => {
        s.setValue(eid, cid, 10);
    };

    let sysSetSpeed = (s, eid, cid, ctx) => {
        s.setSlot(eid, pos, 0, 100);
        s.setSlot(eid, pos, 1, 110);
        s.setSlot(eid, pos, 2, 120);
        s.setSlot(eid, dir, 0, 10);
        s.setSlot(eid, dir, 1, 11);
        s.setSlot(eid, dir, 2, 12);
    };

    let sysCalcSpeed = (s, eid, cid, ctx) => {
        let x  = s.getSlot(eid, pos, 0);
        let y  = s.getSlot(eid, pos, 1);
        let z  = s.getSlot(eid, pos, 2);
        let vx = s.getSlot(eid, dir, 0);
        let vy = s.getSlot(eid, dir, 1);
        let vz = s.getSlot(eid, dir, 2);
        s.setSlot(eid, pos, 0, x + vx);
        s.setSlot(eid, pos, 1, y + vx);
        s.setSlot(eid, pos, 2, z + vx);
    };
    

    runs = 60;

    s.registerSystem(health, sysSetValue);
    // s.registerSystem(health, (s, eid, cid, ctx) => {
    //     s.setValue(eid, cid, 10);
    // });
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.applySystems();
    logtime("1M entities, applySystems", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 600;

    let sysfn = s.systemHandler(health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysfn(s, k, health);
        }
    }
    logtime("1M, getEntities+loop NOP", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 100;

    s.registerSystem(health, sysSetValue);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.applySystems();
    logtime("1M, applySystems with setValue", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 600;
    
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            s.setValue(k, health, 10);
        }
    }
    logtime("1M, getEntities+loop with setValue", mt1, microtime.now(), entityCount, runs, entityCount);

    
    runs = 60;

    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        entities.forEach( eid => s.setValue(eid, health, 10) );
    }
    logtime("1M, getEntities+forEach with setValue", mt1, microtime.now(), entityCount, runs, entityCount);


    runs = 60;
    
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysSetSpeed(s, k);
        }
    }
    logtime("1M, getEntities+loop with sysSetSpeed", mt1, microtime.now(), entityCount, runs, entityCount);

    
    runs = 60;
    
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++) {
        let entities = s.getEntities(health);
        for (let k = 0; k < entities.length; k++) {
            sysCalcSpeed(s, k);
        }
    }
    logtime("1M, getEntities+loop with sysCalcSpeed", mt1, microtime.now(), entityCount, runs, entityCount);

    t.pass();
    
});


test("dummy", t => {
    t.pass();
});

