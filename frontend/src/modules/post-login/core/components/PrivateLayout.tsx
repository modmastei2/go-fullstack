import { Outlet } from 'react-router-dom';
import { useAuth } from '../../../../shared/hooks/auth/useAuth';
import { applyTheme } from '../../../../shared/handlers/theme.handler';

export default function PrivateLayout() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    // theme color palette:
    // +----------------------+----------------------+----------------------+-----------------------------------------+
    // | ELEMENT LEVEL        | LIGHT MODE (SOFT)    | DARK MODE (DEEP)     | TAILWIND CLASSES                        |
    // +----------------------+----------------------+----------------------+-----------------------------------------+
    // | [MAIN LAYER]         |                      |                      |                                         |
    // | BG of Main           | slate-200            | slate-950            | bg-slate-200 dark:bg-slate-950          |
    // | Border of Main       | slate-300            | slate-900            | border-slate-300 dark:border-slate-900  |
    // | Text of Main         | slate-600            | slate-500            | text-slate-600 dark:text-slate-500      |
    // +----------------------+----------------------+----------------------+-----------------------------------------+
    // | [CARD / SURFACE]     |                      |                      |                                         |
    // | BG of Card           | slate-50             | slate-900            | bg-slate-50 dark:bg-slate-900           |
    // | Border of Card       | white (or none)      | slate-800            | border-white dark:border-slate-800      |
    // | Text of Card (Title) | slate-900            | slate-100            | text-slate-900 dark:text-slate-100      |
    // | Text of Card (Body)  | slate-700            | slate-400            | text-slate-700 dark:text-slate-400      |
    // +----------------------+----------------------+----------------------+-----------------------------------------+
    // | [INTERACTIVE]        |                      |                      |                                         |
    // | Input on Card        | slate-200/50         | slate-950/50         | bg-slate-200/50 dark:bg-slate-950/50    |
    // | Hover on Card        | white                | slate-800            | hover:bg-white dark:hover:bg-slate-800  |
    // +----------------------+----------------------+----------------------+-----------------------------------------+

    return (
        <div className="min-h-screen overflow-hidden border bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-200">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-40 border border-white shadow-md bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">My Application</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* toggle theme dark / light button */}
                            <div className="space-x-2">
                                <span className="cursor-pointer" onClick={() => applyTheme('light')}>
                                    Light /
                                </span>
                                <span className="cursor-pointer" onClick={() => applyTheme('dark')}>
                                    Dark /
                                </span>
                                <span className="cursor-pointer" onClick={() => applyTheme('system')}>
                                    System
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600">
                                    <span className="text-sm font-semibold">{user?.username?.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="hidden font-medium sm:block">{user?.username}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white transition bg-red-500 rounded-lg cursor-pointer dark:bg-red-500/75 hover:bg-red-600">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-118px)]">
                {/* <div className="px-8 py-8 border border-white shadow-md bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"> */}
                    <Outlet />
                {/* </div> */}
            </main>

            {/* Footer */}
            <footer className="mt-auto border border-white shadow-md bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <p>© 2025 My Application. All rights reserved.</p>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Auto-lock after 15 minutes of inactivity</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
