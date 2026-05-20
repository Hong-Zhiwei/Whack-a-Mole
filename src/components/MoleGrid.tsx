import React from 'react';
import { Mole } from '../types';
import { MoleHole } from './MoleHole';

interface MoleGridProps {
  moles: (Mole | null)[];
  onWhack: (id: number, clickX: number, clickY: number) => void;
}

export const MoleGrid: React.FC<MoleGridProps> = ({ moles, onWhack }) => {
  return (
    <div 
      id="playfield-grid-wrapper"
      className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden glass-panel border border-white/10 p-4 sm:p-6 md:p-8 shadow-2xl"
    >
      {/* 舞台背景裝飾光效 */}
      <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-yellow-400/5 blur-2xl pointer-events-none" />

      {/* Grid 結構容器 - 3x3 */}
      <div 
        id="mole-holes-grid"
        className="relative z-10 grid grid-cols-3 gap-y-4 gap-x-3 sm:gap-x-4 md:gap-y-6 md:gap-x-6"
      >
        {Array.from({ length: 9 }).map((_, idx) => (
          <MoleHole
            key={idx}
            id={idx}
            mole={moles[idx] || null}
            onWhack={onWhack}
          />
        ))}
      </div>
    </div>
  );
};
