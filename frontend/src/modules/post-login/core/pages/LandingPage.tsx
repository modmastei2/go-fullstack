import { useNavigate } from 'react-router-dom';
import { PreRoute } from '../../../../shared/constants/routes';

export default function LandingPage() {
    const navigate = useNavigate();

    const handleNavigateToLogin = () => {
        navigate(PreRoute.loginFullPath);
    }
    
    const handleNavigateToRegister = () => {
        navigate(PreRoute.registerFullPath);
    }

    return (
        <>
            <div>
                <h1>Welcome to the Landing Page</h1>
                <p>This is the main entry point of the application.</p>
            </div>

            <div className="cursor-pointer my-2" onClick={handleNavigateToLogin}>
                <a className="rounded-md bg-sky-500 text-white px-4 py-2" >Go to Login Page</a>
            </div>
            <div className="cursor-pointer my-2" onClick={handleNavigateToRegister}>
                <a className="rounded-md bg-slate-500 text-white px-4 py-2" >Register</a>
            </div>
        </>
    );
}
