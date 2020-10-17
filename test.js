
// Run test with:
//  npm run test
//  npm run test -- test.js
//  npm run test -- -w test.js

import test from "ava";
import seedrandom from "seedrandom";
import abecs from "./src/abecs.js";


test("test1", t => {

    let s = abecs.newScene();
    let alive = s.registerComponent("alive", Uint8Array);
    let pos = s.registerComponent("pos", Float32Array, 3);
    let dir = s.registerComponent("dir", Float32Array, 3);

    t.is(s.hasBuilt, false);
    s.build(100);
    t.is(s.hasBuilt, true);

    t.is(s.entityCount, 100);
    t.is(s.componentCount, 3);
    
    t.is(s.componentId("alive"), 0);
    t.is(s.componentId("pos"), 1);
    t.is(s.componentId("dir"), 2);
    
    t.is(s.slotCount(alive), 1);
    t.is(s.slotCount(pos), 3);
    t.is(s.slotCount(dir), 3);

    let e0 = s.allocateEntity();
    s.componentOn(e0, alive)
        .componentOn(e0, pos);
    t.is(e0, 0);

    t.is(s.isOn(e0, alive), true);
    t.is(s.isOn(e0, pos), true);
    t.is(s.isOn(e0, dir), false);

    s.setValue(e0, alive, 10);
    t.is(s.valueAt(e0, alive), 10);

    s.setValue(e0, alive, 11);
    t.is(s.valueAt(e0, alive), 11);

    s.setValue(e0, pos, 100);
    s.setValueSlot(e0, pos, 1, 101);
    s.setValueSlot(e0, pos, 2, 102);

    let e1 = s.allocateEntity();
    s.componentOn(e1, dir)
        .componentOn(e1, pos);
    t.is(e1, 1);

    t.is(s.isOn(e1, alive), false);
    t.is(s.isOn(e1, pos), true);
    t.is(s.isOn(e1, dir), true);

    s.setValue(e1, pos, 110);
    s.setValueSlot(e1, pos, 1, 111);
    s.setValueSlot(e1, pos, 2, 112);
    
    t.is(s.getEntities(alive).length, 1);
    t.is(s.getEntities(pos).length, 2);
    t.is(s.getEntities(dir).length, 1);

    s.iterate(alive, (ss, eid) => t.is(eid == 0, true));
    s.iterate(pos,   (ss, eid) => t.is(eid == 0 || eid == 1, true));
    s.iterate(dir,   (ss, eid) => t.is(eid == 1, true));

    t.is(s.getValues(alive)[0], 11);
    t.is(s.getValues(pos)[0], 100);
    t.is(s.getValues(pos)[1], 110);

    s.iterate(pos,   (ss, eid) => {
        t.is(eid == 0 || eid == 1, true);
        let v0 = ss.valueAtSlot(eid, pos, 0);
        t.is(v0 == 100 || v0 == 110, true);
        let v1 = ss.valueAtSlot(eid, pos, 1);
        t.is(v1 == 101 || v1 == 111, true);
        let v2 = ss.valueAtSlot(eid, pos, 2);
        t.is(v2 == 102 || v2 == 112, true);
    });
    
});


test("dummy", t => {
    t.pass();
});

