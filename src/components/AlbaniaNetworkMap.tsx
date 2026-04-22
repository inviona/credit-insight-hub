import React from 'react';
import { motion } from 'framer-motion';

export function AlbaniaNetworkMap() {
  // Cities with approximate percentage coordinates over the albania-kosovo.png image
  const nodes = [
    { name: 'Tirana', x: 45, y: 55, score: 92, status: 'Optimal' },
    { name: 'Prishtine', x: 75, y: 25, score: 88, status: 'Optimal' },
    { name: 'Durres', x: 35, y: 56, score: 85, status: 'Warning' },
    { name: 'Shkoder', x: 38, y: 35, score: 95, status: 'Optimal' },
    { name: 'Vlore', x: 38, y: 75, score: 78, status: 'Warning' },
    { name: 'Korce', x: 65, y: 72, score: 82, status: 'Optimal' },
    { name: 'Elbasan', x: 52, y: 60, score: 90, status: 'Optimal' },
    { name: 'Fier', x: 35, y: 68, score: 86, status: 'Optimal' },
    { name: 'Prizren', x: 62, y: 35, score: 91, status: 'Optimal' },
    { name: 'Gjirokaster', x: 45, y: 85, score: 88, status: 'Optimal' }
  ];

  return (
    <div className="relative w-full aspect-[1/1.5] max-w-sm mx-auto flex items-center justify-center my-8 group">
      {/* Glow behind the map */}
      <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/30" />
      
      {/* The Image with CSS filters to match dark blue tech theme */}
      <motion.img 
        src="/albania-kosovo.png" 
        alt="Albania and Kosovo borders"
        className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none"
        style={{
          // Translates the intense red to a deep tech blue/cyan map
          filter: 'hue-rotate(210deg) saturate(1.5) brightness(1.2) opacity(0.8)'
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Interactive Overlay Nodes */}
      <div className="absolute inset-0 w-full h-full object-contain">
        {nodes.map((node, i) => (
          <div 
            key={node.name}
            className="absolute rounded-full w-4 h-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 peer bg-transparent cursor-pointer z-20 left-1/2 top-1/2" />
            
            <motion.div
              className={`w-2 h-2 rounded-full ${node.status === 'Warning' ? 'bg-amber-400' : 'bg-blue-400'} shadow-[0_0_10px_rgba(96,165,250,0.8)]`}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
            
            {/* Tooltip */}
            <div className="opacity-0 peer-hover:opacity-100 transition-opacity duration-200 absolute left-4 -top-8 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white rounded-lg p-3 w-40 z-30 shadow-2xl pointer-events-none transform -translate-y-2 peer-hover:-translate-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{node.name}</span>
                <div className={`h-2 w-2 rounded-full ${node.status === 'Warning' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`} />
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Risk Score:</span>
                  <span className={`font-bold ${node.status === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{node.score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{node.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}