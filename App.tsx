import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { TreeMorphState } from './types';
import ArixExperience from './components/ArixExperience';
import UIOverlay from './components/UIOverlay';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);
  const [showLoveParticles, setShowLoveParticles] = useState<boolean>(true);

  const toggleState = () => {
    setTreeState((prev) => 
      prev === TreeMorphState.TREE_SHAPE 
        ? TreeMorphState.SCATTERED 
        : TreeMorphState.TREE_SHAPE
    );
  };

  return (
    <div className="relative w-full h-screen bg-[#000a08]">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2, 12], fov: 45 }}
          gl={{ antialias: false, toneMapping: 3, toneMappingExposure: 1.2 }} // ACESFilmicToneMapping
        >
          <Suspense fallback={null}>
            <ArixExperience treeState={treeState} showLoveParticles={showLoveParticles} />
          </Suspense>
        </Canvas>
      </div>

      {/* Loading Indicator */}
      <Loader 
        containerStyles={{ backgroundColor: '#001a14' }}
        innerStyles={{ width: '200px', height: '2px', backgroundColor: '#064e3b' }}
        barStyles={{ height: '2px', backgroundColor: '#fbbf24' }}
        dataStyles={{ fontFamily: 'Cinzel', color: '#fbbf24', fontSize: '14px' }}
      />

      {/* UI Overlay Layer */}
      <UIOverlay 
        treeState={treeState} 
        onToggle={toggleState} 
        showLoveParticles={showLoveParticles}
        onToggleLove={() => setShowLoveParticles(!showLoveParticles)}
      />
    </div>
  );
};

export default App;