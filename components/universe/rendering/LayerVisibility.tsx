'use client';

import React, { createContext, forwardRef, useContext } from 'react';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';

// Whether the enclosing scale layer / LoD group is currently shown. Hidden layers stay mounted (so their
// shaders, textures and registry entries survive) but must not leak anything onto the screen.
export const LayerVisibleContext = createContext(true);

export const useLayerVisible = () => useContext(LayerVisibleContext);

type HtmlProps = React.ComponentPropsWithoutRef<typeof Html>;

// drei's <Html> is a DOM overlay: it ignores the `visible` flag of its three.js parents, so a label inside a
// hidden layer would float over an empty sky. This drop-in replacement unmounts the label instead.
//
// It also makes drei's wrapper box click-through. That box (centred on the object for `center` labels) otherwise
// sits on top of the very object it names and silently swallows clicks meant for it. Elements inside a label that
// should be clickable opt back in with `pointer-events-auto`.
//
// Labels stay underneath the HUD: drei's default z-index range reaches 16,777,271, which drew a body's name tag on
// top of its own info card and the docks (all z-30 and above).
const LABEL_Z_INDEX_RANGE: [number, number] = [20, 0];

export const LayerHtml = forwardRef<HTMLDivElement, HtmlProps>(function LayerHtml(props, ref) {
  const visible = useLayerVisible();
  if (!visible) return null;
  const style = props.transform ? props.style : { pointerEvents: 'none' as const, ...props.style };
  // `scene-label` marks DOM that follows a 3D object (tests and layout checks skip it)
  const wrapperClass = props.wrapperClass ? `scene-label ${props.wrapperClass}` : 'scene-label';
  return <Html ref={ref} zIndexRange={LABEL_Z_INDEX_RANGE} {...props} style={style} wrapperClass={wrapperClass} />;
});

export const LayerVisibilityProvider: React.FC<{ visible: boolean; children: React.ReactNode }> = ({
  visible,
  children,
}) => {
  const parentVisible = useLayerVisible();
  return (
    <LayerVisibleContext.Provider value={parentVisible && visible}>{children}</LayerVisibleContext.Provider>
  );
};

// True when the object and all of its ancestors are visible and it is attached to a scene.
export function isObjectRendered(obj: THREE.Object3D): boolean {
  let o: THREE.Object3D | null = obj;
  while (o) {
    if (!o.visible) return false;
    if (!o.parent) return (o as THREE.Scene).isScene === true;
    o = o.parent;
  }
  return false;
}
