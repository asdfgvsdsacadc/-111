import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, ParticleData } from '../types';

interface Props {
  treeState: TreeMorphState;
  showLoveParticles?: boolean;
}

// Configuration
const CONFIG = {
  leafCount: 7500,       
  cubeLeafCount: 1000,   // New cubic leaves for texture
  redRibbonCount: 2000,  
  goldGarlandCount: 1500,
  ornamentCount: 350,    
  loveParticleCount: 2000,
  treeHeight: 11,
  treeBaseRadius: 4.5,
  scatterRadius: 25,
};

// Physics Constants
const PHYSICS = {
  mouseRepulsion: 15.0,   
  mouseRadius: 6.0,
  springStrength: 0.005,  
  damping: 0.96,          
  floatSpeed: 0.1,        
};

// Reusables
const tempPos = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();
const mousePos3D = new THREE.Vector3();
const forceVec = new THREE.Vector3();

// Helper: Random point in spherical volume (for initial scatter and physics target)
const getScatterPos = (minR = 10, maxR = 25) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = minR + Math.cbrt(Math.random()) * (maxR - minR); 
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta) + CONFIG.treeHeight / 2, 
    r * Math.cos(phi)
  );
};

const LuxTree: React.FC<Props> = ({ treeState, showLoveParticles = true }) => {
  // --- Refs ---
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const cubeLeavesRef = useRef<THREE.InstancedMesh>(null); // Ref for new cubes
  const redRef = useRef<THREE.InstancedMesh>(null);
  const goldRef = useRef<THREE.InstancedMesh>(null);
  const ornamentsRef = useRef<THREE.InstancedMesh>(null);
  
  // Love Particles (Hearts & Dots)
  const loveHeartsRef = useRef<THREE.InstancedMesh>(null); 
  const loveDotsRef = useRef<THREE.InstancedMesh>(null); 

  const starRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  // --- GEOMETRIES ---
  
  // 1. Star Geometry
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1; 
    const innerRadius = 0.45;
    const angleOffset = -Math.PI / 2;
    for (let i = 0; i < points * 2; i++) {
        const l = i % 2 === 0 ? outerRadius : innerRadius;
        const a = (i / points) * Math.PI + angleOffset;
        const x = Math.cos(a) * l;
        const y = Math.sin(a) * l;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 3 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  // 2. Hollow Heart Outline Geometry
  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Standard Heart Curve
    shape.moveTo(0, 0); 
    shape.bezierCurveTo(0, 0, -0.6, 0.4, -0.6, 0.7);
    shape.bezierCurveTo(-0.6, 1.1, -0.2, 1.3, 0, 1.0);
    shape.bezierCurveTo(0.2, 1.3, 0.6, 1.1, 0.6, 0.7);
    shape.bezierCurveTo(0.6, 0.4, 0, 0, 0, 0);

    // Create a hole for the "hollow" neon look
    const holePath = new THREE.Path();
    const s = 0.75; // Thickness factor
    holePath.moveTo(0, 0.15);
    holePath.bezierCurveTo(0, 0.15, -0.6*s, 0.4*s + 0.15, -0.6*s, 0.7*s + 0.15);
    holePath.bezierCurveTo(-0.6*s, 1.1*s + 0.15, -0.2*s, 1.3*s + 0.15, 0, 1.0*s + 0.15);
    holePath.bezierCurveTo(0.2*s, 1.3*s + 0.15, 0.6*s, 1.1*s + 0.15, 0.6*s, 0.7*s + 0.15);
    holePath.bezierCurveTo(0.6*s, 0.4*s + 0.15, 0, 0.15, 0, 0.15);
    
    shape.holes.push(holePath);

    const extrudeSettings = { depth: 0.1, bevelEnabled: false };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    // Rotate to face forward
    geom.rotateX(Math.PI); 
    return geom;
  }, []);

  const leafGeometry = useMemo(() => new THREE.ConeGeometry(0.12, 0.4, 3), []);
  const cubeLeafGeometry = useMemo(() => new THREE.BoxGeometry(0.12, 0.12, 0.12), []); // New Cube Geometry
  const ornamentGeometry = useMemo(() => new THREE.SphereGeometry(0.2, 16, 16), []);
  const dotGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

  // --- PARTICLE DATA GENERATION ---
  
  const { leavesData, cubeLeavesData, redData, goldData, ornamentData, loveHeartsData, loveDotsData } = useMemo(() => {
    const generateParticles = (count: number, type: 'LEAF' | 'CUBE_LEAF' | 'ORNAMENT' | 'RIBBON' | 'GARLAND' | 'LOVE_HEART' | 'LOVE_DOT') => {
      const data: ParticleData[] = [];
      for (let i = 0; i < count; i++) {
        const pData = {} as ParticleData;
        
        // 1. Tree Position
        const yPercent = Math.random(); 
        const y = yPercent * CONFIG.treeHeight;
        const currentRadius = (1 - yPercent) * CONFIG.treeBaseRadius;
        const angle = Math.random() * Math.PI * 2;
        
        // Default tree position (Volume or Surface)
        let tx = Math.cos(angle) * currentRadius;
        let tz = Math.sin(angle) * currentRadius;
        
        // Specific Logic per type
        if (type === 'LEAF') {
          // Volumetric foliage
          const rOffset = Math.random() * currentRadius;
          tx = Math.cos(angle) * rOffset;
          tz = Math.sin(angle) * rOffset;
          // Trim top foliage to show star
          const safeY = Math.min(y, CONFIG.treeHeight * 0.92);
          pData.treePos = new THREE.Vector3(tx, safeY, tz);
          pData.color = new THREE.Color().setHSL(0.38 + Math.random() * 0.05, 0.8, 0.15 + Math.random() * 0.2); // Emerald
          pData.scale = 0.5 + Math.random() * 0.8;
        } 
        else if (type === 'CUBE_LEAF') {
          // Surface scatter logic for cubes (mostly outer shell)
          const rOffset = currentRadius * (0.85 + Math.random() * 0.15); 
          tx = Math.cos(angle) * rOffset;
          tz = Math.sin(angle) * rOffset;
          const safeY = Math.min(y, CONFIG.treeHeight * 0.92);
          pData.treePos = new THREE.Vector3(tx, safeY, tz);
          // Slightly different green: lighter/teal-ish for texture
          pData.color = new THREE.Color().setHSL(0.42 + Math.random() * 0.05, 0.7, 0.25 + Math.random() * 0.15);
          pData.scale = 0.5 + Math.random() * 0.4; // Small subtle scale
        }
        else if (type === 'RIBBON') {
          // Broad Red Spirals
          const spirals = 2.5;
          const spiralAngle = yPercent * Math.PI * 2 * spirals;
          tx = Math.cos(spiralAngle) * (currentRadius + 0.2);
          tz = Math.sin(spiralAngle) * (currentRadius + 0.2);
          pData.treePos = new THREE.Vector3(tx, y, tz);
          pData.color = new THREE.Color('#990000');
          pData.scale = 0.8;
        }
        else if (type === 'GARLAND') {
          // Thin Gold Spirals (opposing direction)
          const spirals = 4;
          const spiralAngle = -yPercent * Math.PI * 2 * spirals + Math.PI;
          tx = Math.cos(spiralAngle) * (currentRadius + 0.1);
          tz = Math.sin(spiralAngle) * (currentRadius + 0.1);
          pData.treePos = new THREE.Vector3(tx, y, tz);
          pData.color = new THREE.Color('#FFD700'); 
          pData.scale = 0.4;
        }
        else if (type === 'ORNAMENT') {
          // Surface scatter
          pData.treePos = new THREE.Vector3(tx, y, tz);
          pData.color = Math.random() > 0.6 ? new THREE.Color('#FFD700') : new THREE.Color('#D00000');
          pData.scale = 0.8 + Math.random() * 0.5;
        }
        else if (type === 'LOVE_HEART' || type === 'LOVE_DOT') {
           // Hidden inside tree ("Fairy Lights")
           const rOffset = Math.random() * (currentRadius * 0.8);
           tx = Math.cos(angle) * rOffset;
           tz = Math.sin(angle) * rOffset;
           pData.treePos = new THREE.Vector3(tx, y, tz);
           
           // Tree state: Warm White/Gold glow
           pData.color = new THREE.Color('#fff7e6'); 
           
           // Scatter State: Purple/Pink/Magenta Palette
           const palette = ['#f0abfc', '#d946ef', '#8b5cf6', '#a855f7', '#ec4899'];
           pData.scatterColor = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
           
           pData.scale = type === 'LOVE_HEART' ? 0.3 : 0.2; // Size in tree (small)
        }

        // 2. Scatter Position (Physics Target)
        // Love particles scatter near center, others go wide
        if (type === 'LOVE_HEART' || type === 'LOVE_DOT') {
             pData.initialScatterPos = getScatterPos(5, 20); // Closer to screen center
        } else {
             pData.initialScatterPos = getScatterPos(CONFIG.scatterRadius * 0.5, CONFIG.scatterRadius);
        }
        
        pData.scatterPos = pData.initialScatterPos.clone();
        pData.velocity = new THREE.Vector3((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1);
        
        // 3. Rotations
        pData.treeRot = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        if (type === 'LEAF' || type === 'CUBE_LEAF') {
             // Look slightly up/out
             pData.treeRot = new THREE.Euler(-Math.PI/4 + (Math.random()*0.2), angle, 0);
        }
        pData.scatterRot = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

        // 4. Animation Props
        pData.twinklePhase = Math.random() * Math.PI * 2;
        pData.twinkleSpeed = 0.5 + Math.random() * 2.0;

        pData.type = (type === 'LOVE_HEART' || type === 'LOVE_DOT') ? 'ORNAMENT' : 'LEAF'; // Generic mapping for logic
        data.push(pData);
      }
      return data;
    };

    const loveTotal = CONFIG.loveParticleCount;
    const loveHalf = Math.floor(loveTotal / 2);

    return {
      leavesData: generateParticles(CONFIG.leafCount, 'LEAF'),
      cubeLeavesData: generateParticles(CONFIG.cubeLeafCount, 'CUBE_LEAF'),
      redData: generateParticles(CONFIG.redRibbonCount, 'RIBBON'),
      goldData: generateParticles(CONFIG.goldGarlandCount, 'GARLAND'),
      ornamentData: generateParticles(CONFIG.ornamentCount, 'ORNAMENT'),
      loveHeartsData: generateParticles(loveHalf, 'LOVE_HEART'),
      loveDotsData: generateParticles(loveTotal - loveHalf, 'LOVE_DOT'),
    };
  }, []);

  // --- ANIMATION LOOP ---
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const isScattered = treeState === TreeMorphState.SCATTERED;
    
    // Smooth Transition State
    const targetProgress = isScattered ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, delta * 2.5);
    const t = progressRef.current; // 0 = Tree, 1 = Scattered

    // Update Mouse Physics
    mousePos3D.set(state.pointer.x * 20, state.pointer.y * 10, 5); // Approximate projection

    // Helper to update a specific mesh group
    const updateMesh = (
      mesh: THREE.InstancedMesh | null, 
      data: ParticleData[], 
      isLoveParticle = false
    ) => {
      if (!mesh) return;

      for (let i = 0; i < data.length; i++) {
        const p = data[i];

        // 1. Calculate Positions
        let targetPos = p.treePos;
        
        if (t > 0.01) {
          // Physics Simulation
          // Apply Spring Force towards home
          forceVec.subVectors(p.initialScatterPos, p.scatterPos).multiplyScalar(PHYSICS.springStrength);
          p.velocity.add(forceVec);

          // Apply Mouse Repulsion
          const dist = p.scatterPos.distanceTo(mousePos3D);
          if (dist < PHYSICS.mouseRadius) {
            forceVec.subVectors(p.scatterPos, mousePos3D).normalize().multiplyScalar(PHYSICS.mouseRepulsion / (dist * dist));
            p.velocity.add(forceVec);
          }

          // Apply Floating Drift (Love particles float up)
          if (isLoveParticle) {
            p.velocity.y += PHYSICS.floatSpeed * delta * 0.1;
            // Wrap around height for infinite floating
            if (p.scatterPos.y > 15) {
                p.scatterPos.y = -5;
                p.velocity.y = 0;
            }
          }

          // Damping & Integration
          p.velocity.multiplyScalar(PHYSICS.damping);
          p.scatterPos.add(p.velocity.multiplyScalar(delta * 60)); // Normalize to frame rate

          targetPos = p.scatterPos;
        }

        // Interpolate Position
        tempPos.lerpVectors(p.treePos, targetPos, t);

        // 2. Calculate Rotation
        if (isLoveParticle && isScattered) {
            // Face camera-ish or tumble
            tempQuat.setFromEuler(p.scatterRot); // Tumble
            // Or lookAt camera for hearts? Tumble looks more natural for particles
        } else {
            // Interpolate rotation
            // Simple euler lerp approximation
            const rX = THREE.MathUtils.lerp(p.treeRot.x, p.scatterRot.x, t);
            const rY = THREE.MathUtils.lerp(p.treeRot.y, p.scatterRot.y, t);
            const rZ = THREE.MathUtils.lerp(p.treeRot.z, p.scatterRot.z, t);
            tempQuat.setFromEuler(new THREE.Euler(rX, rY, rZ));
        }

        // 3. Calculate Scale
        let s = p.scale;
        if (isLoveParticle) {
             // Scale up significantly in scatter mode (Hearts need to be visible)
             const treeScale = p.scale; // ~0.3
             const scatterScale = p.scale * 3.5; 
             s = THREE.MathUtils.lerp(treeScale, scatterScale, t);
        }
        tempScale.set(s, s, s);

        // 4. Update Matrix
        tempMatrix.compose(tempPos, tempQuat, tempScale);
        mesh.setMatrixAt(i, tempMatrix);

        // 5. Update Color (Twinkle + Morph)
        tempColor.copy(p.color);
        
        // Twinkle logic
        if (!isScattered) {
            const twinkle = Math.sin(time * p.twinkleSpeed + p.twinklePhase);
            if (p.type === 'LEAF') {
                // Subtle breathing for leaves
                const lum = 0.05 * twinkle; 
                tempColor.offsetHSL(0, 0, lum);
            } else {
                // Bright flash for gold/ornaments/lights
                const lum = 0.15 * twinkle;
                tempColor.offsetHSL(0, 0, lum);
            }
        }

        // Color Morph for Love Particles (Gold -> Neon Pink/Purple)
        if (isLoveParticle && p.scatterColor) {
            tempColor.lerp(p.scatterColor, t);
        }

        mesh.setColorAt(i, tempColor);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    // Run updates
    updateMesh(leavesRef.current, leavesData);
    updateMesh(cubeLeavesRef.current, cubeLeavesData); // Update new cubes
    updateMesh(redRef.current, redData);
    updateMesh(goldRef.current, goldData);
    updateMesh(ornamentsRef.current, ornamentData);

    if (showLoveParticles) {
        updateMesh(loveHeartsRef.current, loveHeartsData, true);
        updateMesh(loveDotsRef.current, loveDotsData, true);
    }

    // Star Animation (Simple wobble)
    if (starRef.current) {
       starRef.current.position.y = CONFIG.treeHeight + 0.5 + Math.sin(time) * 0.1;
       starRef.current.rotation.y += delta * 0.5;
       // Scale star down slightly when scattered to focus on particles? No, keep it as anchor.
    }
  });

  return (
    <group>
      {/* 1. Base Tree Elements */}
      <instancedMesh ref={leavesRef} args={[leafGeometry, undefined, CONFIG.leafCount]}>
        <meshStandardMaterial color="#064e3b" roughness={0.7} metalness={0.1} />
      </instancedMesh>

      {/* 1.5 New Cube Leaves for Texture */}
      <instancedMesh ref={cubeLeavesRef} args={[cubeLeafGeometry, undefined, CONFIG.cubeLeafCount]}>
        <meshStandardMaterial color="#0f766e" roughness={0.6} metalness={0.2} />
      </instancedMesh>

      <instancedMesh ref={redRef} args={[leafGeometry, undefined, CONFIG.redRibbonCount]}>
        <meshStandardMaterial color="#990000" roughness={0.3} metalness={0.6} emissive="#330000" />
      </instancedMesh>

      <instancedMesh ref={goldRef} args={[leafGeometry, undefined, CONFIG.goldGarlandCount]}>
        <meshStandardMaterial color="#FFD700" roughness={0.1} metalness={1.0} emissive="#FFD700" emissiveIntensity={0.4} />
      </instancedMesh>
      
      <instancedMesh ref={ornamentsRef} args={[ornamentGeometry, undefined, CONFIG.ornamentCount]}>
         <meshStandardMaterial roughness={0.2} metalness={0.9} />
      </instancedMesh>

      {/* 2. The Star */}
      <mesh ref={starRef} geometry={starGeometry} position={[0, CONFIG.treeHeight, 0]} scale={0.7}>
         <meshStandardMaterial color="#FDB813" emissive="#FDB813" emissiveIntensity={2.0} roughness={0.1} metalness={1} />
      </mesh>

      {/* 3. Love Particles System */}
      {showLoveParticles && (
        <>
            {/* HEARTS */}
            <instancedMesh ref={loveHeartsRef} args={[heartGeometry, undefined, loveHeartsData.length]}>
                <meshStandardMaterial roughness={0.1} metalness={0.8} emissive="white" emissiveIntensity={1.5} toneMapped={false} />
            </instancedMesh>
         
            {/* DOTS */}
            <instancedMesh ref={loveDotsRef} args={[dotGeometry, undefined, loveDotsData.length]}>
                <meshStandardMaterial roughness={0.1} metalness={0.8} emissive="white" emissiveIntensity={1.5} toneMapped={false} />
            </instancedMesh>
        </>
      )}
    </group>
  );
};

export default LuxTree;