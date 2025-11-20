// src/hooks/useLongPress.ts
import { useRef, useCallback } from "react";

export const useLongPress = (onLongPress: () => void, delay = 600) => {
  const timeoutRef = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);
  const onLongPressRef = useRef(onLongPress);

  // Обновляем ref при изменении onLongPress
  onLongPressRef.current = onLongPress;

  const start = useCallback(() => {
    isLongPressTriggered.current = false;
    timeoutRef.current = setTimeout(() => {
      onLongPressRef.current();
      isLongPressTriggered.current = true;
    }, delay);
  }, [delay]);

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
