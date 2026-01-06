import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { isWindowPopup } from '../../../../shared/handlers/navigator.handler';

const MIN_NAVBAR_WIDTH = 60;
const MAX_NAVBAR_WIDTH = 300;

export default function PrivateLayout() {
    const [width, setWidth] = useState(MIN_NAVBAR_WIDTH);
    const isResizing = useRef(false);

    useEffect(() => {
        const handleMouseUp = () => {
            isResizing.current = false;
        };

        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <>
            <div className="flex">
                {isWindowPopup() ? null : (
                    <div
                        id="navbar"
                        className="relative bg-red-100 h-screen"
                        style={{ width, minWidth: MIN_NAVBAR_WIDTH, maxWidth: MAX_NAVBAR_WIDTH }}
                        onMouseMove={(e) => {
                            if (!isResizing.current) return;

                            // if (e.clientX >= MIN_NAVBAR_WIDTH && e.clientX <= MAX_NAVBAR_WIDTH) {
                            setWidth(
                                e.clientX <= MIN_NAVBAR_WIDTH
                                    ? MIN_NAVBAR_WIDTH
                                    : e.clientX >= MAX_NAVBAR_WIDTH
                                      ? MAX_NAVBAR_WIDTH
                                      : e.clientX,
                            );
                            // }
                        }}>
                        <div>
                            <div
                                id="resize-handle"
                                className="w-7 h-screen cursor-col-resize bg-amber-100 absolute -right-3 opacity-85"
                                onMouseDown={() => {
                                    isResizing.current = true;
                                    console.log('isResizing set to ', isResizing.current);
                                }}></div>
                            <div className="select-none">Navbar {width}</div>
                        </div>
                    </div>
                )}
                <div
                    className="w-full"
                    // onMouseEnter={() => {
                    //     if (isResizing.current) {
                    //         isResizing.current = true;
                    //         console.log('isResizing set to ', isResizing.current);
                    //     }
                    // }}
                    // onMouseUp={() => {
                    //     if (isResizing.current) {
                    //         isResizing.current = true;
                    //         console.log('isResizing set to ', isResizing.current);
                    //     }
                    // }}
                >
                    <div className="header bg-sky-100 p-4 select-none flex justify-between">
                        <div>header</div>
                        <div>
                            <button
                                className="bg-red-300 p-2 rounded-md cursor-pointer"
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    window.location.href = '/pre';
                                }}>
                                Logout
                            </button>
                        </div>
                    </div>
                    <div className="p-4 select-none">
                        <Outlet />
                    </div>
                </div>
            </div>
        </>
    );
}
