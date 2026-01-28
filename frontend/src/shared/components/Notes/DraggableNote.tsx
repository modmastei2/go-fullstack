/* eslint-disable react-hooks/purity */
import { useEffect, useRef, useState } from 'react';

export type Note = {
    id: number;
    title?: string;
    content?: string;
    color: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
};

type DraggableNoteProps = {
    note: Note;
    onClose?: (note: Note) => void;
};

export default function DraggableNote({ note, onClose }: DraggableNoteProps) {
    const popupRef = useRef<HTMLDivElement | null>(null);

    const [position, setPosition] = useState({
        x: note.position?.x || 100 + Math.random() * 150,
        y: note.position?.y || 100 + Math.random() * 150,
    });

    const [size, setSize] = useState({
        width: note.size?.width || 320,
        height: note.size?.height || 200,
    });

    const draggingRef = useRef(false);
    const resizeRef = useRef(false);
    const offsetRef = useRef({ x: 0, y: 0 });

    // Drag start
    const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!popupRef.current) return;

        draggingRef.current = true;

        const rect = popupRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        document.body.style.userSelect = 'none';
    };

    // Resize start
    const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        resizeRef.current = true;

        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Drag
            if (draggingRef.current && popupRef.current) {
                const width = popupRef.current.offsetWidth;
                const height = popupRef.current.offsetHeight;

                let newX = e.clientX - offsetRef.current.x;
                let newY = e.clientY - offsetRef.current.y;

                // Prevent moving out of viewport
                newX = Math.max(0, Math.min(newX, window.innerWidth - width));
                newY = Math.max(0, Math.min(newY, window.innerHeight - height));

                setPosition({ x: newX, y: newY });
            }

            // Resize
            if (resizeRef.current && popupRef.current) {
                const rect = popupRef.current.getBoundingClientRect();

                const newWidth = Math.max(200, e.clientX - rect.left);
                const newHeight = Math.max(120, e.clientY - rect.top);

                setSize({ width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            draggingRef.current = false;
            resizeRef.current = false;
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div
            ref={popupRef}
            style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
            className="fixed overflow-hidden border border-gray-200 rounded-sm shadow-md min-w-96 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
            {/* HEADER (ลากตรงนี้) */}
            <div onMouseDown={startDrag} className="flex items-center justify-between cursor-move bg-blue-500/75">
                <span className="px-3 py-1 font-semibold hover:bg-blue-800/25">+</span>
                <span className="px-3 py-1 font-semibold hover:bg-blue-800/25" onClick={() => onClose?.({ ...note, position, size })}>
                    ✕
                </span>
            </div>

            {/* CONTENT */}
            <textarea
                defaultValue={note.content}
                // rows={4}
                className="w-full h-full p-3 text-sm border-0 rounded focus:outline-none bg-slate-800 border-slate-700"
            />

            {/* RESIZE HANDLE */}
            <div
                onMouseDown={startResize}
                className="absolute bottom-0 right-0 w-4 h-1 cursor-se-resize bg-blue-500/75"
            />
        </div>
    );
}
