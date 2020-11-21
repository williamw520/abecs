
// Run test with:
//  npm run test
//  npm run test -- test-benchmark.js
//  npm run test -- -w test-benchmark.js

import test from "ava";
import microtime from "microtime";
import seedrandom from "seedrandom";
import abecs from "./src/abecs.js";

const FRAME60 = 60;         // for 60 FPS

let timeUnit = 0;
let timeFactorA = [1000, 0.001];
let timeFactorB = [1000, 1];
let timeLabelA  = ["nanoseconds", "milliseconds"];
let timeLabelB  = ["nanoseconds",  "microseconds"];


function logheader() {
    let msg = 
        "| Function Area ".padEnd(44, " ") +
        "| Number of ".padEnd(12, " ") +
        "| Runs ".padEnd(14, " ") +
        "| Total Time ".padEnd(13, " ") +
        "| Time/Run ".padEnd(15, " ") +
//      "| Time/Run ".padEnd(15, " ") +
//      "| Operations ".padEnd(14, " ") +
//      "| nanosec/op ".padEnd(13, " ") +
//      "| ops/sec ".padEnd(17, " ") +
        "| Runs/frame ".padEnd(16, " ") +
        "| FPS of Runs ".padEnd(18, " ") +
        "|";
    console.log(msg);
    msg = 
        "|  ".padEnd(44, " ") +
        "| Entities ".padEnd(12, " ") +
        "|  ".padEnd(14, " ") +
        "| millisecs ".padEnd(13, " ") +
        "|" + (" " + timeLabelA[timeUnit]).padEnd(14, " ") +
//      "|" + (" " + timeLabelB[timeUnit]).padEnd(14, " ") +
//      "|  ".padEnd(14, " ") +
//      "|  ".padEnd(13, " ") +
//      "|  ".padEnd(17, " ") +
        "| 60-fps frame ".padEnd(16, " ") +
        "|  ".padEnd(18, " ") +
        "|";
    console.log(msg);
    msg = 
        "|:".padEnd(44, "-") +
        "|:".padEnd(12, "-") +
        "|:".padEnd(14, "-") +
        "|:".padEnd(13, "-") +
        "|:".padEnd(15, "-") +
//      "|:".padEnd(15, "-") +
//      "|:".padEnd(14, "-") +
//      "|:".padEnd(13, "-") +
//      "|:".padEnd(17, "-") +
        "|:".padEnd(16, "-") +
        "|:".padEnd(18, "-") +
        "|";
    console.log(msg);
}

function logtime(tag, mt1, mt2, entityCount, runs, opsPerRun) {
    const microseconds = (mt2 - mt1) || 1;
    const ms = microseconds / 1000;
    const ops = runs * (opsPerRun || 1);
    const ops_rate  = Math.floor( ops / microseconds * 1000000 );
    const sec_per_run     = microseconds / 1000 / 1000 / runs;
    const ms_per_run      = microseconds / 1000 / runs;
    const timeA_per_run   = Math.floor( (microseconds * timeFactorA[timeUnit] / runs) * 1000 ) / 1000;
    const timeB_per_run   = Math.floor( (microseconds * timeFactorB[timeUnit] / runs) * 10  ) / 10;
    const runs_per_second = (runs * 1000000) / microseconds;
    const runs_per_frame  = Math.floor( (runs_per_second / FRAME60) * 100 ) / 100;
    const runs_fps = Math.floor( runs_per_frame * FRAME60 * 10 ) / 10;
    const unit_time = (microseconds * 1000) / ops;
    const msg = 
        "| " + (tag + " ").padEnd(42, " ") +
        "| " + (entityCount.toLocaleString()).padEnd(10, " ") +
        "| " + (runs.toLocaleString()).padEnd(12, " ") +
        "| " + (Math.round(ms).toLocaleString()).padEnd(11, " ") +
        "| " + (timeA_per_run.toLocaleString()).padEnd(13, " ") +
//      "| " + (timeB_per_run.toLocaleString()).padEnd(13, " ") +
//      "| " + (ops.toLocaleString()).padEnd(12, " ") +
//      "| " + (unit_time.toLocaleString()).padEnd(11, " ") +
//      "| " + (ops_rate.toLocaleString()).padEnd(15, " ") +
        "| " + (runs_per_frame.toLocaleString()).padEnd(14, " ") +
        "| " + (runs_fps.toLocaleString()).padEnd(16, " ") +
        "|";
    console.log(msg);
}



test("api", t => {
    
    timeUnit = 0;          // Set time unit index to 0, for microseconds and nanoseconds
    
    console.log("\n");
    console.log("=== Benchmark on API ====\n");
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
        s.hasComponent(0, health);
    logtime("component health hasComponent 0", mt1, microtime.now(), entityCount, runs, 1);

    runs = 500000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.hasComponent(1, pos);
    logtime("component pos hasComponent 1", mt1, microtime.now(), entityCount, runs, 1);


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


    let pos3 = new Float32Array(3);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlots(1, pos, pos3, 0);
    logtime("getSlots 1", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlots(99999, pos, pos3, 0);
    logtime("getSlots 99999", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlots3(1, pos, pos3, 0);
    logtime("getSlots3 1", mt1, microtime.now(), entityCount, runs, 1);

    runs = 100000000;
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getSlots3(99999, pos, pos3, 0);
    logtime("getSlots3 99999", mt1, microtime.now(), entityCount, runs, 1);

    
    
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
        s.getEntityIds(health);
    logtime("getEntityIds of on-component", mt1, microtime.now(), entityCount, runs, 1);
    t.is(s.getEntityIds(health).length, entityCount);


    runs = 100000000;
    for (let k = 0; k < entityCount; k++)
        s.componentOff(k, health);
    mt1 = microtime.now();
    for (let i = 0; i < runs; i++)
        s.getEntityIds(health);
    logtime("getEntityIds of off-component", mt1, microtime.now(), entityCount, runs, 1);
    t.is(s.getEntityIds(health).length, 0);


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


test("system-fn", t => {

    timeUnit = 1;          // Set time unit index to 1, for milliseconds and microseconds.

    console.log("\n");
    console.log("=== Benchmark on System Functions ====\n");
    logheader();
    
    function dotests(tag, entityCount, runFactor) {

        let mt1, mt2, runs;

        // Create a new scene object to encapsulate all the entities and components.
        let s = abecs.newScene();

        // Register 3 components to the scene.
        let health = s.registerComponent("health", Uint8Array);
        let pos = s.registerComponent("pos", Float32Array, 3);
        let dir = s.registerComponent("dir", Float32Array, 3);

        // Initialize all the data structures for the entities.
        s.build(entityCount);

        // Allocate all the entities and attach components to them.
        for (let k = 0; k < entityCount; k++) {
            let eid = s.allocateEntity();
            s.componentOn(eid, health);
            s.componentOn(eid, pos);
            s.componentOn(eid, dir);
        }
        t.is(s.getEntityIds(health).length, entityCount);

        // Set up some system functions.

        let health1w = (s, eid, ctx) => {
            s.setValue(eid, health, 10);            // set 1 component value.
        };

        let speed3w = (s, eid, ctx) => {
            s.setSlot(eid, dir, 0, 10);             // set 3 values
            s.setSlot(eid, dir, 1, 11);
            s.setSlot(eid, dir, 2, 12);
        };

        let position3w = (s, eid, ctx) => {
            s.setSlot(eid, pos, 0, 100);            // set 3 values
            s.setSlot(eid, pos, 1, 110);
            s.setSlot(eid, pos, 2, 120);
        };

        let speed4r2w = (s, eid, ctx) => {
            let x  = s.getSlot(eid, pos, 0);        // 4 reads
            let y  = s.getSlot(eid, pos, 1);
            let vx = s.getSlot(eid, dir, 0);        //
            let vy = s.getSlot(eid, dir, 1);
            s.setSlot(eid, pos, 0, x + vx);         // 2 writes
            s.setSlot(eid, pos, 1, y + vx);
        };

        let speed6r3w = (s, eid, ctx) => {
            let x  = s.getSlot(eid, pos, 0);        // 6 reads
            let y  = s.getSlot(eid, pos, 1);
            let z  = s.getSlot(eid, pos, 2);
            let vx = s.getSlot(eid, dir, 0);
            let vy = s.getSlot(eid, dir, 1);
            let vz = s.getSlot(eid, dir, 2);
            s.setSlot(eid, pos, 0, x + vx);         // 3 writes
            s.setSlot(eid, pos, 1, y + vx);
            s.setSlot(eid, pos, 2, z + vx);
        };

        // Register a system function first.
        s.registerSystem(health, health1w);

        // Inline function somehow is really slow.
        // s.registerSystem(health, (s, eid, ctx) => {
        //     s.setValue(eid, 10);
        // });


        // Run the benchmarks.

        runs = 10000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++)
            s.applySystems();
        logtime(tag + ", health1w, applySystems", mt1, microtime.now(), entityCount, runs, entityCount);

        // Register another system function.  From this point, applySystems() will run both system functions.
        s.registerSystem(dir, speed3w);

        runs = 4000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++)
            s.applySystems();
        logtime(tag + ", health1w, speed3w, applySystems", mt1, microtime.now(), entityCount, runs, entityCount);


        // Run the raw getEntityIds() loop directly with the system function.
        runs = 10000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            const ids = s.getEntityIds(health);
            for (let k = 0; k < ids.length; k++) {
                health1w(s, ids[k]);
            }
        }
        logtime(tag + ", health1w, getEntityIds loop", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 2000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            s.getEntityIds(health).forEach(eid => health1w(s, eid));
        }
        logtime(tag + ", health1w, getEntityIds forEach", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 2000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            const ids = s.getEntityIds(health);
            for (let k = 0; k < ids.length; k++) {
                health1w(s, ids[k]);
            }
            const ids2 = s.getEntityIds(pos);
            for (let k = 0; k < ids2.length; k++) {
                speed3w(s, ids2[k]);
            }
        }
        logtime(tag + ", health1w speed3w, getEntityIds loop", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 10000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            let ids = s.getEntityIds(health);
            for (let k = 0; k < ids.length; k++) {
                s.setValue(ids[k], health, 10);
            }
        }
        logtime(tag + ", 1 setValue, getEntityIds loop", mt1, microtime.now(), entityCount, runs, entityCount);

        
        runs = 5000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            let ids = s.getEntityIds(health);
            ids.forEach( eid => s.setValue(eid, health, 10) );
        }
        logtime(tag + ", 1 setValue, getEntityIds forEach", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 5000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            let ids = s.getEntityIds(health);
            for (let k = 0; k < ids.length; k++) {
                speed3w(s, ids[k]);
            }
        }
        logtime(tag + ", speed3w, getEntityIds loop", mt1, microtime.now(), entityCount, runs, entityCount);

        
        runs = 5000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            s.getEntityIds(health).forEach( eid => speed3w(s, eid) )
        }
        logtime(tag + ", speed3w, getEntityIds forEach", mt1, microtime.now(), entityCount, runs, entityCount);

        
        runs = 2000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            let ids = s.getEntityIds(dir);
            for (let k = 0; k < ids.length; k++) {
                speed6r3w(s, ids[k]);
            }
        }
        logtime(tag + ", speed6r3w, getEntityIds loop", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 2000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            s.getEntityIds(health).forEach( eid => speed6r3w(s, eid) )
        }
        logtime(tag + ", speed6r3w, getEntityIds forEach", mt1, microtime.now(), entityCount, runs, entityCount);


        // Overwrite the dir's system function.  Still retain the health.
        //s.registerSystem(health, health1w);
        s.registerSystem(dir, speed4r2w);

        runs = 5000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++)
            s.applySystems();
        logtime(tag + ", speed4r2w + health1w, applySystems", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 4000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            const ids = s.getEntityIds(pos);
            for (let k = 0; k < ids.length; k++) {
                speed4r2w(s, ids[k]);
            }
        }
        logtime(tag + ", speed4r2w + health1w, loop", mt1, microtime.now(), entityCount, runs, entityCount);

        
        runs = 4000 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            s.getEntityIds(health).forEach(eid => speed4r2w(s, eid));
        }
        logtime(tag + ", speed4r2w + health1w, forEach", mt1, microtime.now(), entityCount, runs, entityCount);

    }

    dotests("10K",  10000, 1);
    dotests("100K", 100000, 0.1);
    dotests("1M",   1000000, 0.01);
    dotests("2M",   2000000, 0.005);
    dotests("5M",   5000000, 0.002);
    dotests("10M",  10000000, 0.001);

    t.pass();
    
});


test("create-destroy", t => {

    timeUnit = 1;          // Set time unit index to 0

    console.log("\n");
    console.log("=== Benchmark on entity creation and destruction ====\n");
    logheader();

    function dotests(tag, entityCount, runFactor) {

        let mt1, mt2, runs;

        // Create a new scene object to encapsulate all the entities and components.
        let s = abecs.newScene();

        // Register 3 components to the scene.
        let health = s.registerComponent("health", Uint8Array);
        let pos = s.registerComponent("pos", Float32Array, 3);
        let dir = s.registerComponent("dir", Float32Array, 3);

        // Initialize all the data structures for the entities.
        s.build(entityCount);


        runs = 1 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            for (let k = 0; k < entityCount; k++) {
                let eid = s.allocateEntity();
            }
        }
        logtime(tag + ", allocateEntity", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 1 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            for (let k = 0; k < entityCount; k++)
                s.freeEntity(k);
        }
        logtime(tag + ", freeEntity", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 1 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            for (let k = 0; k < entityCount; k++) {
                let eid = s.allocateEntity();
                s.componentOn(eid, health);
            }
        }
        logtime(tag + ", allocateEntity, add 1 component", mt1, microtime.now(), entityCount, runs, entityCount);
        
        
        runs = 1 * runFactor;
        mt1 = microtime.now();
        let eids = s.getEntityIds(health);
        for (let k = 0; k < eids.length; k++) {
            s.getValue(eids[k], health);
        }
        logtime(tag + ", iterate 1 component", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 1 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            for (let k = 0; k < entityCount; k++)
                s.freeEntity(k);
        }
        logtime(tag + ", freeEntity, with 1 component", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 1 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            for (let k = 0; k < entityCount; k++) {
                let eid = s.allocateEntity();
                s.componentOn(eid, health);
                s.componentOn(eid, pos);
            }
        }
        logtime(tag + ", allocateEntity, add 2 components", mt1, microtime.now(), entityCount, runs, entityCount);
        
        
        runs = 1 * runFactor;
        mt1 = microtime.now();
        eids = s.getEntityIds(health);
        for (let k = 0; k < eids.length; k++) {
            s.getValue(eids[k], health);
            s.getValue(eids[k], pos);
        }
        logtime(tag + ", iterate 2 components", mt1, microtime.now(), entityCount, runs, entityCount);


        runs = 1 * runFactor;
        mt1 = microtime.now();
        for (let i = 0; i < runs; i++) {
            for (let k = 0; k < entityCount; k++)
                s.freeEntity(k);
        }
        logtime(tag + ", freeEntity, with 2 components", mt1, microtime.now(), entityCount, runs, entityCount);

    }

    dotests("100K",  100000, 1);
    dotests("1M",   1000000, 1);
    dotests("5M",   5000000, 1);
    dotests("10M",  10000000, 1);
    dotests("20M",  20000000, 1);

    t.pass();
    
});


test("dummy", t => {
    t.pass();
});


