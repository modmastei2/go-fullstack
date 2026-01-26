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

    return (
        <div className="min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-800">
            {/* Navigation Bar */}
            <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">My Application</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* toggle theme dark / light button */}
                            <div className="space-x-2 dark:text-gray-200">
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
                                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">{user?.username?.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="text-gray-700 dark:text-gray-200 font-medium hidden sm:block">{user?.username}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500 dark:bg-red-500/75 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm cursor-pointer">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-118px)]">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
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
