import React from 'react';
import { TreeMorphState } from '../types';

interface Props {
  treeState: TreeMorphState;
  onToggle: () => void;
  showLoveParticles?: boolean;
  onToggleLove?: () => void;
}

const UIOverlay: React.FC<Props> = ({ treeState, onToggle, showLoveParticles = true, onToggleLove }) => {
  const isTree = treeState === TreeMorphState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-10">
      
      {/* Header */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left animate-fade-in-down">
        <h1 className="font-display text-4xl md:text-6xl text-[#fbbf24] tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
          Arix
        </h1>
        <h2 className="font-body text-[#4ade80] text-sm md:text-base tracking-[0.3em] uppercase mt-2 opacity-80">
          Signature Collection
        </h2>
      </div>

      {/* Center Controls */}
      <div className="pointer-events-auto flex flex-col items-center justify-center space-y-6 pb-10">
        
        <div className="relative group">
          {/* Button Glow Background */}
          <div className={`absolute -inset-1 bg-gradient-to-r from-[#fbbf24] to-[#d97706] rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 ${isTree ? 'opacity-40' : 'opacity-20'}`}></div>
          
          <button
            onClick={onToggle}
            className="relative px-12 py-4 bg-[#00241b] rounded-full leading-none flex items-center divide-x divide-gray-600 border border-[#047857]/50 hover:border-[#fbbf24] transition-all duration-300 shadow-2xl"
          >
            <span className={`font-display text-lg tracking-widest uppercase transition-colors duration-300 ${isTree ? 'text-[#fbbf24]' : 'text-gray-400'}`}>
              Assemble
            </span>
            <span className={`pl-6 font-display text-lg tracking-widest uppercase transition-colors duration-300 ${!isTree ? 'text-[#fbbf24]' : 'text-gray-400'}`}>
              Scatter
            </span>
          </button>
        </div>

        {/* Love Mode Toggle */}
        <button 
          onClick={onToggleLove}
          className={`px-6 py-2 rounded-full border border-[#fbbf24]/30 text-xs font-display tracking-widest uppercase transition-all duration-300 hover:bg-[#fbbf24]/10 hover:border-[#fbbf24] ${showLoveParticles ? 'text-[#fbbf24] bg-[#fbbf24]/5 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-gray-500'}`}
        >
          Love Mode: {showLoveParticles ? 'ON' : 'OFF'}
        </button>

        <p className="font-body text-xs text-[#4ade80] tracking-widest opacity-50 pt-4">
          INTERACTIVE 3D EXPERIENCE
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 right-8 hidden md:block text-right opacity-30">
        <div className="w-16 h-[1px] bg-[#fbbf24] ml-auto mb-2"></div>
        <p className="font-display text-[#fbbf24] text-xs">EST. 2024</p>
      </div>
    </div>
  );
};

export default UIOverlay;