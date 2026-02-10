import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleDetectorOptions {
    idleTimeout?: number;
    onIdled?: () => void;
    onActive?: () => void;
    throttleDelaySec?: number;
    syncAcrossTabs?: boolean;
}

const useIdleDetector = ({
    idleTimeout = 15 * 60 * 1000, // 15 นาที (default)
    onIdled: onIdle,
    onActive,
    throttleDelaySec = 1 * 1000,
    syncAcrossTabs = true,
}: UseIdleDetectorOptions = {}) => {

    const [isIdle, setIsIdle] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const throttleRef = useRef<number | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const broadcastRef = useRef<BroadcastChannel | null>(null);

    const onIdleRef = useRef(onIdle);
    const onActiveRef = useRef(onActive);

    useEffect(() => {
        onIdleRef.current = onIdle;
        onActiveRef.current = onActive;
    }, [onIdle, onActive]);

    const triggerIdle = useCallback((shouldBroadcast = true) => {
        setIsIdle(prevIdle => {
            // เช็คว่า state เปลี่ยนจริงๆ ถึงจะ broadcast
            if (!prevIdle && shouldBroadcast && syncAcrossTabs && broadcastRef.current) {
                broadcastRef.current.postMessage({
                    type: 'idle',
                    timestamp: Date.now(),
                });
            }
            if (!prevIdle) {
                onIdleRef.current?.();
            }
            return true;
        });
    }, [syncAcrossTabs]);

    const triggerActive = useCallback(() => {
        setIsIdle(prevIdle => {
            // เช็คว่า state เปลี่ยนจริงๆ
            if (prevIdle) {
                onActiveRef.current?.();
                // ไม่ต้อง broadcast "active" เพราะมัน redundant กับ "activity"
            }
            return false;
        });
    }, []);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const now = Date.now();
        lastActivityRef.current = now;

        // Broadcast activity ไปยัง tabs อื่น
        if (syncAcrossTabs && broadcastRef.current) {
            broadcastRef.current.postMessage({
                type: 'activity',
                timestamp: now,
            });
        }

        if (isIdle) {
            triggerActive();
        }

        // ตั้ง timer ใหม่ทุกครั้ง (ไม่ว่า tab จะ active หรือไม่)
        timeoutRef.current = setTimeout(() => {
            triggerIdle();
        }, idleTimeout);
    }, [idleTimeout, isIdle, syncAcrossTabs, triggerIdle, triggerActive]);

    useEffect(() => {
        // Handle visibility change
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // เมื่อ tab กลับมา active
                const timeSinceLastActivity = Date.now() - lastActivityRef.current;

                if (timeSinceLastActivity >= idleTimeout) {
                    // ถ้าเกินเวลากำหนดแล้ว ให้ idle ทันที
                    triggerIdle();
                } else {
                    // ถ้ายังไม่เกิน ให้ตั้ง timer ต่อ
                    const remainingTime = idleTimeout - timeSinceLastActivity;
                    console.log('Tab active again, setting remaining timer:', remainingTime);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }

                    timeoutRef.current = setTimeout(() => {
                        triggerIdle();
                    }, remainingTime);
                }
            }
            // เมื่อ tab ไม่ active: ปล่อยให้ timer วิ่งต่อไป
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [idleTimeout, triggerIdle]);

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
            // เช็คว่า tab นี้ active อยู่หรือไม่ก่อน reset
            if (document.hidden) {
                return;
            }

            if (!throttleRef.current) {
                throttleRef.current = setTimeout(() => {
                    resetTimer();
                    throttleRef.current = null;
                }, throttleDelaySec);
            }
        }



        // Setup Broadcast Channel
        if (syncAcrossTabs && typeof BroadcastChannel !== 'undefined') {
            broadcastRef.current = new BroadcastChannel('idle-detector');

            broadcastRef.current.onmessage = (event) => {
                const { type, timestamp } = event.data;
                console.log('Received broadcast message:', type, timestamp);
                if (type === 'activity') {
                    // Tab อื่นมี activity
                    lastActivityRef.current = timestamp;

                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }

                    if (isIdle) {
                        triggerActive();
                    }

                    timeoutRef.current = setTimeout(() => {
                        triggerIdle(false);
                    }, idleTimeout);

                } else if (type === 'idle') {
                    // Tab อื่น idle แล้ว ให้ tab นี้ idle ด้วย (ไม่ broadcast ซ้ำ)
                    triggerIdle(false);
                }
                // ลบ "active" message ออกเพราะ redundant กับ "activity"
            };
        }

        // Register events (เฉพาะเมื่อ tab active)
        events.forEach(event => {
            window.addEventListener(event, throttledReset, { passive: true });
        });

        // เริ่มต้น timer
        resetTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, throttledReset);
            });

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            if (throttleRef.current) {
                clearTimeout(throttleRef.current);
            }

            if (broadcastRef.current) {
                broadcastRef.current.close();
            }
        }

    }, [resetTimer, throttleDelaySec, isIdle, idleTimeout, syncAcrossTabs, triggerIdle, triggerActive]);

    return {
        isIdle,
        lastActivityRef: lastActivityRef.current,
        reset: resetTimer
    }
};

export default useIdleDetector;