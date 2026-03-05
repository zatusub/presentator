"use client";

import { useCallback, useRef } from "react";

type SwipeDirection = "left" | "right";

type UseSwipeOptions = {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number;
};

export function useSwipe({
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
}: UseSwipeOptions) {
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const onTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            const deltaX = e.changedTouches[0].clientX - touchStartX.current;
            const deltaY = e.changedTouches[0].clientY - touchStartY.current;

            // Only trigger if horizontal movement > vertical (prevent conflict with scroll)
            if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) {
                return;
            }

            const direction: SwipeDirection = deltaX > 0 ? "right" : "left";
            if (direction === "left" && onSwipeLeft) onSwipeLeft();
            if (direction === "right" && onSwipeRight) onSwipeRight();
        },
        [onSwipeLeft, onSwipeRight, threshold]
    );

    return { onTouchStart, onTouchEnd };
}
