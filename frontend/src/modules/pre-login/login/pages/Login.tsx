import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    const handleLogin = () => {
        console.log('Login clicked');

        localStorage.setItem('token', 'dummy-auth-token');

        navigate('/');
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className=" p-2 rounded-md shadow-md min-w-xl bg-sky-50">
                <h2>Login</h2>

                <div className="mt-4">
                    <input type="text" placeholder="Username" className="block w-full mb-4 p-2 border border-gray-300 rounded-md" />
                    <input type="password" placeholder="Password" className="block w-full mb-4 p-2 border border-gray-300 rounded-md" />
                    <button className="w-full bg-sky-500 text-white p-2 rounded-md cursor-pointer" onClick={handleLogin}>
                        Login
                    </button>
                    <div className="text-center my-2">or</div>
                    <div>
                        <button className="w-full bg-blue-600 text-white p-2 rounded-md cursor-pointer">Login with MS365</button>
                    </div>

                    <div className="text-end">
                        <Link to="/pre/register">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
