
// Run test with:
//  npm run test
//  npm run test -- test.js
//  npm run test -- -w test.js

import test from "ava";
import seedrandom from "seedrandom";
import abecs from "./src/abecs.js";


test("test1", t => {

    let s = abecs.newScene();
    let health = s.registerComponent("health", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(100);
    t.is(s.hasBuilt, true);

    t.is(s.entityCount, 100);
    t.is(s.componentCount, 3);
    
    t.is(s.componentId("health"), 0);
    t.is(s.componentId("pos"), 1);
    t.is(s.componentId("dir"), 2);
    
    t.is(s.slotCount(health), 1);
    t.is(s.slotCount(pos), 3);
    t.is(s.slotCount(dir), 3);

    let e0 = s.allocateEntity();
    s.componentOn(e0, health)
        .componentOn(e0, pos);
    t.is(e0, 0);

    t.is(s.hasComponent(e0, health), true);
    t.is(s.hasComponent(e0, pos), true);
    t.is(s.hasComponent(e0, dir), false);

    s.setValue(e0, health, 10);
    t.is(s.getValue(e0, health), 10);

    s.setValue(e0, health, 11);
    t.is(s.getValue(e0, health), 11);

    s.setValue(e0, pos, 100);
    s.setSlot(e0, pos, 1, 101);
    s.setSlot(e0, pos, 2, 102);

    let e1 = s.allocateEntity();
    s.componentOn(e1, dir)
        .componentOn(e1, pos);
    t.is(e1, 1);

    t.is(s.componentOnCount(health), 1);
    t.is(s.componentOnCount(pos), 2);
    t.is(s.componentOnCount(dir), 1);

    t.is(s.hasComponent(e1, health), false);
    t.is(s.hasComponent(e1, pos), true);
    t.is(s.hasComponent(e1, dir), true);

    s.setValue(e1, pos, 110);
    s.setSlot(e1, pos, 1, 111);
    s.setSlot(e1, pos, 2, 112);

    t.is(s._toEntityIds(health).length, 1);
    t.is(s._toEntityIds(pos).length, 2);
    t.is(s._toEntityIds(dir).length, 1);

    s.setComponentValue(e0, pos, 100);
    s.setComponentSlot(e0, pos, 1, 101);
    s.setComponentSlot(e0, pos, 2, 102);
    t.is(s.getSlot(e0, pos, 0), 100);
    t.is(s.getSlot(e0, pos, 1), 101);
    t.is(s.getSlot(e0, pos, 2), 102);

    let value3 = new Float32Array(3);
    s.getSlots(e0, pos, value3, 0);
    t.is(value3[0], 100);
    t.is(value3[1], 101);
    t.is(value3[2], 102);
    
    let value10 = new Float32Array(10);
    s.getSlots(e1, pos, value10, 5);
    t.is(value10[5], 110);
    t.is(value10[6], 111);
    t.is(value10[7], 112);
    
    s.iterate(health,   (s, eid) => t.is(eid == 0, true));
    s.iterate(pos,      (s, eid) => t.is(eid == 0 || eid == 1, true));
    s.iterate(dir,      (s, eid) => t.is(eid == 1, true));

    t.is(s.toValues(health)[0], 11);
    t.is(s.toValues(pos)[0], 100);
    t.is(s.toValues(pos)[1], 110);

    s.iterate(pos,      (ss, eid) => {
        t.is(eid == 0 || eid == 1, true);
        let v0 = ss.getSlot(eid, pos, 0);
        t.is(v0 == 100 || v0 == 110, true);
        let v1 = ss.getSlot(eid, pos, 1);
        t.is(v1 == 101 || v1 == 111, true);
        let v2 = ss.getSlot(eid, pos, 2);
        t.is(v2 == 102 || v2 == 112, true);
    });

    s.getEntityIds(pos);
    s.getEntityIds(pos);
    s.getEntityIds(pos);
    s.getEntityIds(pos);
    s.getEntityIds(pos);

    s._resetGetter(pos);
    s.getEntityIds(pos);
    s.getEntityIds(pos);
    s.getEntityIds(pos);

    s.registerSystem(health, (s, eid, ctx) => {
        console.log("sys health " + eid + " " + ctx);
    }).registerSystem(pos, (s, eid, ctx) => {
        console.log("sys pos " + eid + " " + ctx);
    }).registerSystem(dir, (s, eid, ctx) => {
        console.log("sys dir " + eid + " " + ctx);
    });

    s.applySystems("abc");

    if (abecs.ENABLE_SLOT_PARAM_CHECK)
        t.throws( () => { s.getSlot(e1, pos, 3) }, null, "Slot index is out of bound" );

});


test("dummy", t => {
    t.pass();
});

