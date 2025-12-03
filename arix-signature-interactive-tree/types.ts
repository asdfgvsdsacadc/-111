import * as THREE from 'three';

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface ParticleData {
  // The calculated position on the Christmas tree surface/volume
  treePos: THREE.Vector3;
  // The current dynamic position in the scattered cloud (updates with physics)
  scatterPos: THREE.Vector3;
  // The original "home" position in the scattered cloud (target for spring force)
  initialScatterPos: THREE.Vector3;
  // Velocity for physics simulation
  velocity: THREE.Vector3;
  
  // Rotation for the tree state
  treeRot: THREE.Euler;
  // Random rotation for scatter state
  scatterRot: THREE.Euler;
  // Base scale
  scale: number;
  // Type of particle
  type: 'LEAF' | 'ORNAMENT';
  color: THREE.Color;
  // Target color when in scattered state (e.g. Red/Pink for hearts)
  scatterColor?: THREE.Color;
  
  // Animation properties for twinkling effect
  twinklePhase: number;
  twinkleSpeed: number;
}

export interface TreeConfig {
  count: number;
  radius: number;
  height: number;
  scatterRadius: number;
}