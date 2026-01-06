import { Navigate, Outlet } from "react-router-dom";

export default function PublicGuard() {
    const isAuthenticated = !!localStorage.getItem('token');

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}