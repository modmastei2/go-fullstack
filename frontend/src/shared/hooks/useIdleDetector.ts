import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleDetectorOptions {
    idleTimeout?: number;
    onIdle?: () => void;
    onActive?: () => void;
    throttleDelaySec?: number;
}

const useIdleDetector = ({
    idleTimeout = 15 * 60 * 1000, // 15 นาที (default)
    onIdle,
    onActive,
    throttleDelaySec = 1 * 1000
}: UseIdleDetectorOptions = {}) => {

    const [isIdle, setIsIdle] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const throttleRef = useRef<number | null>(null);
    const lastActivityRef  = useRef<number>(Date.now());

    const onIdleRef = useRef(onIdle);
    const onActiveRef = useRef(onActive);

    useEffect(() => {
        onIdleRef.current = onIdle;
        onActiveRef.current = onActive;
    }, [onIdle, onActive]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        lastActivityRef .current = Date.now();

        if (isIdle) {
            setIsIdle(false);
            onActiveRef.current?.();
        }

        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
            onIdleRef.current?.();
        }, idleTimeout);
        
    }, [idleTimeout, isIdle]);

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
        const throttledReset = () => {
            if (!throttleRef.current) {
                throttleRef.current = setTimeout(() => {
                    resetTimer();
                    throttleRef.current = null;
                }, throttleDelaySec);
            }
        }

        // register event
        events.forEach(event => {
            window.addEventListener(event, throttledReset, { passive: true});
        })

        // เริ่มต้น timer
        resetTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, throttledReset);
            });

            if(timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if(throttleRef.current) {
                clearTimeout(throttleRef.current);
            }
        }
        
    }, [resetTimer, throttleDelaySec]);

    return {
        isIdle,
        lastActivityRef: lastActivityRef.current,
        reset: resetTimer
    }
};

export default useIdleDetector;