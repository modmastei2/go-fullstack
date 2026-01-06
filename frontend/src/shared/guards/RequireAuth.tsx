import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
        return <Navigate to="/pre" replace />;
    } 

    return <Outlet />;
}