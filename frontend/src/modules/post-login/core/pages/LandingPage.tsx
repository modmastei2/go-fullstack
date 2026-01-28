import { useAuth } from "../../../../shared/hooks/auth/useAuth";
import { useLoader } from "../../../../shared/hooks/loader/useLoader";

export default function LandingPage() {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoader();

    function testHandler() {
        showLoading();
        
        setTimeout(() => {
            hideLoading();
        }, 2000);
    }

    return (
        <div className="space-y-6">
            {/* Welcome Card */}
            <div className="p-6 border border-white rounded-lg shadow-md bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-gray-200">
                    Welcome back, {user?.username}! 👋
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    You're now logged in to your dashboard.
                </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Auto Lock Info */}
                <div className="p-6 text-white rounded-lg shadow-md bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800">
                    <div className="flex items-center mb-4">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-xl font-semibold">Auto-Lock</h3>
                    </div>
                    <p className="text-blue-100">
                        Your session will automatically lock after 15 minutes of inactivity for security.
                    </p>
                </div>

                {/* Session Timeout */}
                <div className="p-6 text-white rounded-lg shadow-md bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700">
                    <div className="flex items-center mb-4">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold">Session Timeout</h3>
                    </div>
                    <p className="text-yellow-100">
                        After locking, you have 10 minutes to unlock before automatic logout.
                    </p>
                </div>

                {/* Security */}
                <div className="p-6 text-white rounded-lg shadow-md bg-gradient-to-br from-green-500 to-green-600 dark:from-green-700 dark:to-green-800">
                    <div className="flex items-center mb-4">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h3 className="text-xl font-semibold">Secure</h3>
                    </div>
                    <p className="text-green-100">
                        Your session is protected with backend validation and automatic token refresh.
                    </p>
                </div>
            </div>

            {/* Content Card */}
            <div className="p-6 border border-white rounded-lg shadow-md bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                <h3 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200" onClick={testHandler}>Dashboard</h3>
                <div className="space-y-4">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
                        <h4 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">User Information</h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>User ID:</strong> {user?.userId}</p>
                            <p><strong>Username:</strong> {user?.username}</p>
                        </div>
                    </div>

                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-gray-800 dark:border-blue-700">
                        <h4 className="flex items-center mb-2 font-semibold text-blue-800 dark:text-blue-200">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            How it works
                        </h4>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>The system tracks your activity (mouse, keyboard, scroll)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>After 15 minutes of no activity, the screen locks automatically</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Enter your password to unlock and continue working</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>If locked for 10+ minutes, you'll be logged out for security</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-gray-800 dark:border-purple-700">
                        <h4 className="mb-2 font-semibold text-purple-800 dark:text-purple-200">Security Features</h4>
                        <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                            <li>✓ JWT Token Authentication</li>
                            <li>✓ Automatic Token Refresh</li>
                            <li>✓ Backend Session Validation</li>
                            <li>✓ Idle Activity Detection</li>
                            <li>✓ Secure Password Verification</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
