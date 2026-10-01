'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { isLaunched } from '@/lib/frames';

/** Renders a spacecraft only once the sky date has reached its launch date (LAUNCH_UTC in data/bodyFrames.ts) */
export const LaunchGate: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const [launched, setLaunched] = useState(() => isLaunched(id));
  const last = useRef(launched);
  useFrame(() => {
    const now = isLaunched(id);
    if (now !== last.current) {
      last.current = now;
      setLaunched(now);
    }
  });
  return launched ? <>{children}</> : null;
};
