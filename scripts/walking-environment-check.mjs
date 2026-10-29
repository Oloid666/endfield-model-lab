import assert from 'node:assert/strict';
import * as T from 'three';
import {walkingEnvironment} from '../src/walking-environment.js';
import {makeLocomotion} from '../src/locomotion.js';
const floor={obstacles:[{x:2,z:0,w:1,d:1}],entrance:{minX:-1,maxX:.6,z:1.8}},root=new T.Group(),walk=makeLocomotion(root,new T.Group());
for(const intact of [true,false,true,false,true,false]){
 walk.setObstacles(walkingEnvironment(floor,{postgame:true,intact,doorOpen:false}));assert(walk.free(0,8));assert(!walk.free(0,13));assert.equal(walk.free(2,0),!intact);assert.equal(walk.free(-.22,1.895),!intact);
}
walk.setObstacles(walkingEnvironment(floor,{postgame:true,doorOpen:true}));assert(walk.free(-.22,1.895));
walk.setAvoidance(()=>false);walk.setAvoidanceEnabled(false);walk.teleport(0,5);walk.setMove(0,1);for(let i=0;i<80;i++)walk.update(.05);assert(root.position.z>7,'airborne proxy must not stop road movement');
walk.setObstacles(walkingEnvironment(floor,{postgame:false}));assert(!walk.free(0,8));
console.log('Walking environment: six building switches, doors, ghost collision and replay boundaries passed.');
