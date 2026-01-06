import { Link } from 'react-router-dom';

export default function Register() {
    return (
        <>
            <div className="flex items-center justify-center h-screen">
                <div className=" p-2 rounded-md shadow-md min-w-xl bg-sky-50">
                    <h2>Login</h2>

                    <div className="mt-4">
                        <input type="text" placeholder="Username" className="block w-full mb-4 p-2 border border-gray-300 rounded-md" />
                        <input type="password" placeholder="Password" className="block w-full mb-4 p-2 border border-gray-300 rounded-md" />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="block w-full mb-4 p-2 border border-gray-300 rounded-md"
                        />
                        <button className="w-full bg-sky-500 text-white p-2 rounded-md cursor-pointer">Sign In</button>

                        <div className="text-end">
                            <Link to="/pre/forgot-password">
                                <a href="/asd">Forgot password ?</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
