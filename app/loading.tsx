import React from 'react';
import { Atom } from 'lucide-react';

export default function RootLoading() {
  return (
    <div
      id="root-streaming-loader"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020617] select-none"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 40%, rgba(30, 27, 75, 0.45) 0%, rgba(2, 6, 23, 0.98) 75%)',
      }}
    >
      {/* Background Micro-Stars Texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Central Holographic Hub */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Holographic Gyroscopic Rings */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center mb-8">
          {/* Outer Dashed Gyro Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/30 animate-spin-slow" />

          {/* Middle Counter-Rotating Violet Ring */}
          <div
            className="absolute inset-3 rounded-full border border-purple-500/40 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '14s' }}
          />

          {/* Glowing Quantum Core Corona */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-400/30 to-purple-600/20 blur-md animate-pulse" />

          {/* Inner Core Display */}
          <div className="relative z-10 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-slate-950/90 border border-cyan-400/50 shadow-2xl shadow-cyan-500/30 backdrop-blur-xl">
            <Atom className="w-8 h-8 text-cyan-400 animate-spin-slow" />
          </div>
        </div>

        {/* Brand & Lab Title */}
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mb-1.5 flex items-center gap-2">
          <span>Ibrahim Science Laboratory</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-6 tracking-wide">
          Initializing Spacetime & Quantum Astrophysics Simulation
        </p>

        {/* High-Tech Laser Track (Pulsing Initializer) */}
        <div className="w-full relative mb-4">
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden relative shadow-inner p-[1px]">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
          </div>
        </div>

        {/* Initial Diagnostic Text */}
        <div className="min-h-[2.5rem] flex items-center justify-center text-xs text-sky-300 font-mono tracking-tight px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md mb-6 w-full text-center">
          <span className="truncate animate-pulse">
            Establishing Deep Space Telemetry Stream...
          </span>
        </div>
      </div>
    </div>
  );
}
