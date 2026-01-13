import React, { useState, useEffect } from 'react';
import { isAxiosError } from '../../../../shared/handlers/api.handler';

interface LockScreenProps {
    username: string;
    onUnlock: (password: string) => Promise<void>;
    onLogout: () => Promise<void>;
    lockedAt: number;
}

const LockScreen: React.FC<LockScreenProps> = ({ username, onUnlock, onLogout, lockedAt }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 นาที = 600 วินาที

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
            const remaining = 600 - elapsed; // 10 นาที

            if (remaining <= 0) {
                handleForceLogout();
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockedAt]);

    const handleForceLogout = () => {
        onLogout();
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onUnlock(password);
            setPassword(''); // Clear password after successful unlock
        } catch (err: unknown) {
            const errs = isAxiosError(err) ? err : null;
            setError(errs?.response?.data?.message || 'Invalid password');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50 backdrop-blur-sm"></div>
            
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Screen Locked</h2>
                    <p className="text-gray-600">Welcome back, {username}</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            autoFocus
                            disabled={loading}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Unlocking...' : 'Unlock'}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-yellow-800">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Auto-logout in:</span>
                        </div>
                        <span className="text-lg font-bold text-yellow-900">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleForceLogout}
                    className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm font-medium py-2 transition"
                >
                    Logout Now
                </button>
            </div>
        </div>
    );
};

export default LockScreen;