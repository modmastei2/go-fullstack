import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleDetectorOptions {
    idleTimeout?: number;
    onIdle?: () => void;
    onActive?: () => void;
}

const useIdleDetector = ({
    idleTimeout = 15 * 60 * 1000, // 15 นาที (default)
    onIdle,
    onActive,
}: UseIdleDetectorOptions = {}) => {

    const [isIdle, setIsIdle] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const lastActivityRef  = useRef<number>(Date.now());

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        lastActivityRef .current = Date.now();

        if (isIdle) {
            setIsIdle(false);
            onActive?.();
        }

        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
            onIdle?.();
        }, idleTimeout);
        
    }, [idleTimeout, isIdle, onIdle, onActive]);

    useEffect(() => {
              // Events ที่จะ reset timer
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
        ];

        // Throttle เพื่อไม่ให้ resetTimer ถูกเรียกบ่อยเกินไป
        let throttleTimer: number | null = null;
        const throttledReset = () => {
            if(!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    resetTimer();
                    throttleTimer = null;
                }, 1000) // throttle 1 วินาที
            }
        };

        events.forEach(events => {
            window.addEventListener(events, throttledReset);
        })

        // เริ่มต้น timer
        resetTimer();

        return () => {
            events.forEach(events => {
                window.removeEventListener(events, throttledReset);
            });

            if(timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if(throttleTimer) {
                clearTimeout(throttleTimer);
            }
        }
        
    }, [resetTimer]);

    return {
        isIdle,
        lastActivityRef: lastActivityRef.current,
        reset: resetTimer
    }
};

export default useIdleDetector;