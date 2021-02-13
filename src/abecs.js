/*
  Abecs.js - Array-based entity component system.
  Copyright (C) 2020 William Wong (williamw520@gmail.com).  All rights reserved.
*/

import {BitVec} from "./bitvec/bitvec.js";


//const ENABLE_SLOT_PARAM_CHECK = true;           // Note: Enabling check causes a branching test, that results in 3 times slowdown in getSlot()/setSlot().
const ENABLE_SLOT_PARAM_CHECK = false;


// abecs module, the entry point to the ABECS.
let abecs = (function() {
    const abecs = {};

    abecs.newScene = () => new ABScene();

    class ABScene {

        // All entities have the same number of components.
        // Of the components of an entity, some are relevant to the entity and the rest are irrelevant.
        // Entities have their relevant components marked active while the irrelevant ones are marked inactive.
        constructor() {
            this._hasBuilt = false;             // during initial building phase, not fully built yet.
            this._entityCount = 0;
            this._lowestFreeId = 0;

            this._arrayTypes = [];              // the array type of the component data array.
            this._componentNameIds = {};        // map between component name and component id.
            this._componentIdNames = {};        // map between component id and component name.
            this._slotsPerEntity = [];          // the slots per entity for each component.
            this._systemFns = [];               // system handlers for the components.

            // inuse: ..111.11.11..
            // comp1: ....1.1..11..
            // comp2: ..11.........
            // comp3: .......1.....
            this._entityInUse = null;           // the bit vector tracking which entity is used and which is free.
            this._activeComponents = [];        // one bit vector per component to track the active state of the component to entities.
            this._componentData = [];           // the component data arrays.
            this._memorizers = {};
            this._entityIdsGetters = {};
        }

        // componentName - descriptive component name; should be unique, for looking up the component id.
        // 
        // componentArrayType - the array type for the component data array.
        //  Array, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, 
        //  Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array
        //
        // slotsPerEntity - the component slots per entity.
        //  A component can have multiple slots per entity, e.g. position has [s1,s2,s3] for (x,y,z)
        //
        // @return componentId
        registerComponent(componentName, componentArrayType, slotsPerEntity) {
            if (validArrayTypes.indexOf(componentArrayType) == -1)
                throw Error("Unsupported component array type " + componentArrayType + " for component " + componentName);
            if ((slotsPerEntity || 1) < 1)
                throw Error("Invalid argument for slotsPerEntity " + slotsPerEntity + " for component " + componentName);

            let componentId = this._arrayTypes.length;
            this._componentNameIds[componentName] = componentId;
            this._componentIdNames[componentId] = componentName;
            this._arrayTypes.push(componentArrayType);
            this._slotsPerEntity.push((slotsPerEntity || 1));
            return componentId;
        }

        registerSystem(componentId, systemFn) {
            this._systemFns[componentId] = systemFn;
            return this;
        }

        // Re-build all the entity, component, and value arrays.
        // All previous data are removed.  It's an effective reset.
        //
        // entityCount - The number of entities to allocate space for the arrays.
        build(entityCount) {
            this._entityCount = entityCount ? entityCount : this._entityCount;

            this._entityInUse = new BitVec(entityCount);
            this._activeComponents  = range(0, this.componentCount).map( _ => new BitVec(this.entityCount) );

            this._componentData = [];
            this._memorizers = {};
            this._entityIdsGetters = {};
            for (let cid = 0; cid < this.componentCount; cid++) {
                let totalSlots = this.entityCount * this._slotsPerEntity[cid];
                this._componentData.push(new this._arrayTypes[cid](totalSlots));
                this._memorizers[cid] = this._memorizeGetter.bind(this, cid);
                this._resetGetter(cid);
            }

            this._hasBuilt = true;
            return this;
        }


        get hasBuilt()          { return this._hasBuilt }

        get entityCount()       { return this._entityCount }

        get componentCount()    { return this._arrayTypes.length }

        componentId(name)       { return this._componentNameIds[name] }

        componentName(cid)      { return this._componentIdNames[cid] }

        arrayType(componentId)  { return this._arrayTypes[componentId] }

        slotCount(componentId)  { return this._slotsPerEntity[componentId] }

        systemHandler(cid)      { return this._systemFns[cid] }

        allocateEntity() {
            let entityId = this._entityInUse.nextOff(this._lowestFreeId);
            if (entityId >= 0) {
                this._entityInUse.bitOn(entityId);
                this._lowestFreeId = entityId + 1;
            }
            return entityId;
        }

        freeEntity(entityId) {
            this._entityInUse.bitOff(entityId);
            // Mark all components of the entity inactive to avoid the game loop updating/rendering the freed entity.
            for (let cid = 0; cid < this.componentCount; cid++) {
                this._activeComponents[cid].bitOff(entityId);
                this._resetGetter(cid);
            }
            if (entityId < this._lowestFreeId) {
                this._lowestFreeId = entityId;
            }
        }

        isInUse(entityId) {
            return this._entityInUse.isOn(entityId);
        }

        hasComponent(entityId, componentId) {
            return this._activeComponents[componentId].isOn(entityId);
        }

        componentOn(entityId, componentId) {
            this._activeComponents[componentId].bitOn(entityId);
            this._resetGetter(componentId);
            return this;
        }

        componentsOn(entityId, ...componentIds) {
            componentIds.forEach( componentId => {
                this._activeComponents[componentId].bitOn(entityId);
                this._resetGetter(componentId);
            })
            return this;
        }

        componentOff(entityId, componentId) {
            this._activeComponents[componentId].bitOff(entityId);
            this._resetGetter(componentId);
            return this;
        }

        componentsOff(entityId, ...componentIds) {
            componentIds.forEach( componentId => {
                this._activeComponents[componentId].bitOff(entityId);
                this._resetGetter(componentId);
            });
            return this;
        }

        componentOnCount(componentId) {
            return this._activeComponents[componentId].cardinality();
        }


        getComponentArray(componentId) {
            return this._componentData[componentId];
        }

        getSlotBase(entityId, componentId) {
            return entityId * this.slotCount(componentId);
        }

        getValue(entityId, componentId) {
            let slotIndex = entityId * this.slotCount(componentId);
            return this._componentData[componentId][slotIndex];
        }

        getSlot(entityId, componentId, slot) {
            let slotCount = this._checkParamOnSlotCount(componentId, slot);
            let slotIndex = entityId * slotCount + slot;
            return this._componentData[componentId][slotIndex];
        }

        getSlots2(entityId, componentId, toValues, offset) {
            let slotBase  = entityId * this.slotCount(componentId);
            let array     = this._componentData[componentId];
            toValues[offset]    = array[slotBase];
            toValues[offset+1]  = array[slotBase + 1];
        }

        getSlots3(entityId, componentId, toValues, toOffset) {
            let slotBase  = entityId * this.slotCount(componentId);
            let array     = this._componentData[componentId];
            toValues[toOffset]   = array[slotBase];
            toValues[toOffset+1] = array[slotBase + 1];
            toValues[toOffset+2] = array[slotBase + 2];
        }

        getSlots4(entityId, componentId, toValues, toOffset) {
            let slotBase  = entityId * this.slotCount(componentId);
            let array     = this._componentData[componentId];
            toValues[toOffset]   = array[slotBase];
            toValues[toOffset+1] = array[slotBase + 1];
            toValues[toOffset+2] = array[slotBase + 2];
            toValues[toOffset+3] = array[slotBase + 3];
        }

        getSlots5(entityId, componentId, toValues, toOffset) {
            let slotBase  = entityId * this.slotCount(componentId);
            let array     = this._componentData[componentId];
            toValues[toOffset]   = array[slotBase];
            toValues[toOffset+1] = array[slotBase + 1];
            toValues[toOffset+2] = array[slotBase + 2];
            toValues[toOffset+3] = array[slotBase + 3];
            toValues[toOffset+4] = array[slotBase + 4];
        }

        getSlots6(entityId, componentId, toValues, toOffset) {
            let slotBase  = entityId * this.slotCount(componentId);
            let array     = this._componentData[componentId];
            toValues[toOffset]   = array[slotBase];
            toValues[toOffset+1] = array[slotBase + 1];
            toValues[toOffset+2] = array[slotBase + 2];
            toValues[toOffset+3] = array[slotBase + 3];
            toValues[toOffset+4] = array[slotBase + 4];
            toValues[toOffset+5] = array[slotBase + 5];
        }

        getSlots(entityId, componentId, toValues, toOffset) {
            let slotBase  = entityId * this.slotCount(componentId);
            let array     = this._componentData[componentId];
            for (let i = 0; i < toValues.length; i++) {
                toValues[toOffset + i] = array[slotBase + i];
            }
        }

        setValue(entityId, componentId, value) {
            let slotIndex = entityId * this.slotCount(componentId);
            this._componentData[componentId][slotIndex] = value;
            return this;
        }

        setSlot(entityId, componentId, slot, value) {
            let slotCount = this._checkParamOnSlotCount(componentId, slot);
            let slotIndex = entityId * slotCount + slot;
            this._componentData[componentId][slotIndex] = value;
            return this;
        }

        setComponentValue(entityId, componentId, value) {
            return this.componentOn(entityId, componentId).setValue(entityId, componentId, value);
        }

        setComponentSlot(entityId, componentId, slot, value) {
            return this.componentOn(entityId, componentId).setSlot(entityId, componentId, slot, value);
        }

        // Iterate over all entities with the active component on.
        // Call back on the systemFn for each entity, with parameters of this ABScene object and the entityId.
        // No memory allocation during iteration.
        iterate(componentId, systemFn, ctx) {
            let bitvec = this._activeComponents[componentId];
            for (let entityId = 0; (entityId = bitvec.nextOn(entityId)) != -1; entityId++) {
                systemFn(this, entityId, ctx);
            }
        }

        getEntityIds(componentId) {
            return this._entityIdsGetters[componentId]();
        }

        _resetGetter(componentId) {
            this._entityIdsGetters[componentId] = this._memorizers[componentId];
        }

        _memorizeGetter(componentId) {
            //console.log("_memorizeGetter " + componentId);
            const cachedEntityIds = this._toEntityIds(componentId);
            this._entityIdsGetters[componentId] = () => cachedEntityIds;
            return cachedEntityIds;
        }

        // Return an array of entity ids whose entities with the active component on.
        // Note: allocating a new array.
        _toEntityIds(componentId) {
            let entityIds = [];
            this.iterate(componentId, (_, eId) => entityIds.push(eId));
            return entityIds;
        }

        // Return a map of component values keyed with entityId with the active component on.
        // Note: the new array causes memory allocation.
        toValues(componentId) {
            return this.getEntityIds(componentId).reduce( (map, eId) => (map[eId] = this.getValue(eId, componentId), map), {});
        }

        // Return a map of component slot values keyed with entityId with the active component on.
        // Note: the new array causes memory allocation.
        toSlotValues(componentId, slot) {
            return this.getEntityIds(componentId).reduce( (map, eId) => (map[eId] = this.getSlot(eId, componentId, slot), map), {});
        }

        applySystems(ctx) {
            for (let cid = 0; cid < this._systemFns.length; cid++) {
                let systemFn = this._systemFns[cid];
                if (systemFn) {
                    let entityIds = this.getEntityIds(cid);
                    for (let k = 0; k < entityIds.length; k++) {
                        systemFn(this, entityIds[k], ctx);
                    }
                }
            }
        }

        countSystems() {
            return this._systemFns.filter( fn => fn ).length;
        }

        _checkParamOnSlotCount(componentId, slot) {
            const slotCount = this.slotCount(componentId);
            // Note: Enabling the check causes a branching test, that results in 3 times slowdown in the getSlot()/setSlot() benchmark.
            if (ENABLE_SLOT_PARAM_CHECK && slot >= slotCount)
                throw Error(`Slot index ${slot} is out of bound for the component "${ this.componentName(componentId) }" with a slot count of ${slotCount}`);
            return slotCount;
        }

    }

    const validArrayTypes = [ Array, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, 
                              Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array ];

    const range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

    abecs.ENABLE_SLOT_PARAM_CHECK = ENABLE_SLOT_PARAM_CHECK;
    
    return abecs;
}());

export default abecs;
