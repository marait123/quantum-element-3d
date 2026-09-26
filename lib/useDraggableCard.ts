'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DraggableOptions {
  initialX?: number;
  initialY?: number;
  cardWidth?: number;
  cardHeight?: number;
  disabledOnMobile?: boolean;
}

export function useDraggableCard(options: DraggableOptions = {}) {
  const {
    initialX = 16,
    initialY = 80,
    cardWidth = 320,
    cardHeight = 400,
    disabledOnMobile = true,
  } = options;

  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, cardX: initialX, cardY: initialY });
  const isPointerDownRef = useRef(false);

  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabledOnMobile && isMobile()) return;
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Don't drag if user clicked an interactive child (button, input, a, etc.)
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return;
    }

    e.preventDefault();
    isPointerDownRef.current = true;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      cardX: pos.x,
      cardY: pos.y,
    };
    setIsDragging(true);
  }, [disabledOnMobile, isMobile, pos.x, pos.y]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.pointerX;
      const deltaY = e.clientY - dragStartRef.current.pointerY;

      const maxX = Math.max(10, (window.innerWidth || 1000) - cardWidth - 10);
      const maxY = Math.max(10, (window.innerHeight || 800) - cardHeight - 10);

      const newX = Math.min(Math.max(10, dragStartRef.current.cardX + deltaX), maxX);
      const newY = Math.min(Math.max(10, dragStartRef.current.cardY + deltaY), maxY);

      setPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, cardWidth, cardHeight]);

  return {
    pos,
    setPos,
    isDragging,
    handlePointerDown,
    isMobile: isMobile(),
  };
}
