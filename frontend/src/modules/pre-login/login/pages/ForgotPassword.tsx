export default function ForgotPassword() {
    return (
        <>
            <div className="flex items-center justify-center h-screen">
                <div className=" p-2 rounded-md shadow-md min-w-xl bg-sky-50">
                    <h2>Forgot Password</h2>
                    <div className="mt-4">
                        <input type="email" placeholder="Email Address" className="block w-full mb-4 p-2 border border-gray-300 rounded-md" />
                        <button className="w-full bg-sky-500 text-white p-2 rounded-md cursor-pointer">Submit</button>
                    </div>


                    <div className="text-end">
                        <a href="/pre">Back to Login</a>
                    </div>
                </div>
            </div>
        </>
    );
}