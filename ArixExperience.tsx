import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeMorphState } from '../types';
import LuxTree from './LuxTree';

interface Props {
  treeState: TreeMorphState;
  showLoveParticles?: boolean;
}

const ArixExperience: React.FC<Props> = ({ treeState, showLoveParticles = true }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Slow continuous rotation for the whole group to make it feel cinematic
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <>
      <color attach="background" args={['#000503']} />
      
      {/* Cinematic Fog - Deep Emerald Tint (kept for depth, but tree will be bright) */}
      <fog attach="fog" args={['#000503', 10, 40]} />

      {/* Camera Controls */}
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 3} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={25}
        dampingFactor={0.05}
      />

      {/* Lighting System - BRIGHTNESS BOOSTED */}
      {/* Strong Ambient to prevent black shadows */}
      <ambientLight intensity={1.5} color="#ffffff" />
      
      {/* Main Warm Key Light - Boosted for Gold reflections */}
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={800} 
        color="#fff0cc" 
        castShadow 
        shadow-bias={-0.0001}
      />
      
      {/* Fill Light (Cooler) - Increased */}
      <pointLight position={[-10, 5, -10]} intensity={200} color="#e0f7fa" />
      
      {/* Back Rim Light (Warm) - Increased for silhouette */}
      <pointLight position={[0, 5, -15]} intensity={300} color="#fbbf24" />

      {/* Environment for shiny reflections */}
      <Environment preset="city" environmentIntensity={1.5} />

      <group ref={groupRef} position={[0, -5, 0]}>
        <LuxTree treeState={treeState} showLoveParticles={showLoveParticles} />
      </group>

      {/* Floor Shadows */}
      <ContactShadows 
        position={[0, -5.1, 0]} 
        opacity={0.6} 
        scale={30} 
        blur={2.5} 
        far={5} 
        color="#000000" 
      />

      {/* Post Processing Pipeline */}
      <EffectComposer enableNormalPass={false}>
        {/* High Bloom for the "Gold Glow" */}
        <Bloom 
          luminanceThreshold={1.2} 
          mipmapBlur 
          intensity={1.0} 
          radius={0.4}
        />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </>
  );
};

export default ArixExperience;