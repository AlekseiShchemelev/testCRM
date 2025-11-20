// src/hooks/useLongPress.ts
import { useRef, useCallback } from 'react';

export const useLongPress = (onLongPress: () => void, delay = 600) => {
  const timeoutRef = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);

  const start = useCallback(() => {
    isLongPressTriggered.current = false;
    timeoutRef.current = setTimeout(() => {
      onLongPress();
      isLongPressTriggered.current = true;
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  };
};