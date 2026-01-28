import { useCallback, useEffect, useState } from 'react';
import type { Note } from './DraggableNote';
import DraggableNote from './DraggableNote';

let notes: Note[] = [
    {
        id: 1,
        title: 'Sample Note',
        content: 'This is a sample note content.',
        color: 'yellow',
    },
    {
        id: 2,
        title: 'Another Note',
        content:
            'lorem2000 ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 00 ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 00 ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 00 ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 00 ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        color: 'blue',
    },
];

const colorMap: Record<string, string> = {
    blue: `
            bg-blue-50 border-blue-400
            dark:bg-blue-900/30 dark:border-blue-600
        `,
    green: `
            bg-green-50 border-green-400
            dark:bg-green-900/30 dark:border-green-600
        `,
    yellow: `
            bg-yellow-50 border-yellow-400
            dark:bg-yellow-900/30 dark:border-yellow-600
        `,
    red: `
            bg-red-50 border-red-400
            dark:bg-red-900/30 dark:border-red-600
        `,
    purple: `
            bg-purple-50 border-purple-400
            dark:bg-purple-900/30 dark:border-purple-600
        `,
};

export default function MyNote() {
    const [openedNote, setOpenedNote] = useState<Note[]>([]);

    useEffect(() => {
        console.log('openedNote changed:', openedNote);
    }, [openedNote]);

    const handleOpenNote = (note: Note) => {
        setOpenedNote((prev: Note[]) => (prev.some((n: Note) => n.id === note.id) ? prev : [...prev, note]));
    };

    const handleCloseNote = (noteId: number) => {
        setOpenedNote((prev: Note[]) => prev.filter((n: Note) => n.id !== noteId));
    };

    const returnNote = useCallback((note: Note) => {
        handleCloseNote(note.id);
        notes = notes.map((n) => (n.id === note.id ? note : n));
        console.log('Note returned:', note);
    }, []);

    return (
        <div className="p-4 border border-gray-200 rounded-lg shadow-md min bg-slate-50 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
            <div className="flex items-center justify-between mb-2">
                <div>+</div>
                <div className="flex items-center space-x-2.5">
                    <div>*</div>
                    <div>X</div>
                </div>
            </div>
            <div className="mb-2">
                <div className="grid grid-cols-1 shrink-0 focus-within:relative">
                    <input
                        className="p-1 border rounded-md border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-300"
                        placeholder="Search notes..."
                        type="text"
                        name="search_note"
                        id="search_note"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <h4 className="text-lg font-semibold">My Note</h4>
                <div className="text-2xl">☁️</div>
            </div>
            {/* border-blue-500 */}
            <div>
                {notes.map((note) => (
                    <div
                        key={note.id}
                        onDoubleClick={() => handleOpenNote(note)}
                        className={`mb-4 p-4 border-t-4 rounded-sm shadow-sm ${colorMap[note.color] || colorMap.blue}`}>
                        <h5 className="mb-2 font-semibold text-md">{note.title}</h5>
                        <span className="text-sm line-clamp-3">{note.content}</span>
                    </div>
                ))}

                {/* popup */}
                {openedNote.map((note: Note) => (
                    <DraggableNote key={note.id} note={note} onClose={(closeNote) => returnNote(closeNote)}></DraggableNote>
                ))}
            </div>
        </div>
    );
}
