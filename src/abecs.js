/*
  Abecs.js - Array-based entity component system.",
  Copyright (C) 2020 William Wong (williamw520@gmail.com).  All rights reserved.",
*/

import {BitVec} from "./lib/bitvec.js";


const ENABLE_SLOT_PARAM_CHECK = true;           // Note: Enabling check causes a branching test, that results in 3 times slowdown in getSlot()/setSlot().
//const ENABLE_SLOT_PARAM_CHECK = false;


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

            // inuse: ..111.11.11..
            // comp1: ....1.1..11..
            // comp2: ..11.........
            // comp3: .......1.....
            this._entityInUse = null;           // the bit vector tracking which entity is used and which is free.
            this._activeComponents = [];        // one bit vector per component to track the active state of the component to entities.
            this._componentData = [];           // the component data arrays.
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

        // Re-build all the entity, component, and value arrays.
        // All previous data are removed.  It's an effective reset.
        //
        // entityCount - The number of entities to allocate space for the arrays.
        build(entityCount) {
            this._entityCount = entityCount ? entityCount : this._entityCount;

            this._entityInUse = new BitVec(entityCount);
            this._activeComponents  = range(0, this.componentCount).map( _ => new BitVec(this.entityCount) );

            this._componentData = [];
            for (let cidx = 0; cidx < this.componentCount; cidx++) {
                let totalSlots = this.entityCount * this._slotsPerEntity[cidx];
                this._componentData.push(new this._arrayTypes[cidx](totalSlots));
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
            for (let cidx = 0; cidx < this.componentCount; cidx++) {
                this._activeComponents[cidx].bitOff(entityId);
            }
            if (entityId < this._lowestFreeId) {
                this._lowestFreeId = entityId;
            }
        }

        isInUse(entityId) {
            return this._entityInUse.isOn(entityId);
        }

        isOn(entityId, componentId) {
            return this._activeComponents[componentId].isOn(entityId);
        }

        componentOn(entityId, componentId) {
            this._activeComponents[componentId].bitOn(entityId);
            return this;
        }

        componentOff(entityId, componentId) {
            this._activeComponents[componentId].bitOff(entityId);
            return this;
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

        // Iterate over all entities which are active on the component, mainly for applying a system funcion over the entities.
        // Call back on the systemHandler for each entity, with parameters of this ABScene object and the entityId.
        // No memory allocation during iteration.
        iterate(componentId, systemHandler) {
            let bitvec = this._activeComponents[componentId];
            let entityId = 0;
            while ((entityId = bitvec.nextOn(entityId)) != -1) {
                systemHandler(this, entityId);
                entityId++;
            }
        }

        // Iterate over all entities which are active on the component, mainly for applying system funcion over the entities.
        // Call back on the systemHandler for each entity, with parameters of this ABScene object,
        // the entityId, and the component value of the first slot.
        // No memory allocation during iteration.
        iterateValues(componentId, systemHandler) {
            this.iterate(componentId, (scene, entityId) => systemHandler(scene, entityId, scene.getValue(entityId, componentId)) );
        }

        // Return an array of entity ids whose entities are active with the component.
        // Note: the new array causes memory allocation.
        toEntities(componentId) {
            let entityIds = [];
            this.iterate(componentId, (_, entityId) => entityIds.push(entityId));
            return entityIds;
        }

        // Return a map of component values keyed with entityId, which are active with the component.
        // Note: the new array causes memory allocation.
        toValues(componentId) {
            let valueMap = {}
            this.iterateValues(componentId, (_, entityId, value) => valueMap[entityId] = value);
            return valueMap;
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

    return abecs;
}());

export default abecs;
